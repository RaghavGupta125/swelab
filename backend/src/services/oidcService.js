import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

const secret = () => process.env.JWT_SECRET || 'hostguard_super_secure_jwt_secret_key_lnmiit_cs314_2026';

export const isOidcConfigured = () => Boolean(
  process.env.OIDC_ISSUER && process.env.OIDC_CLIENT_ID && process.env.OIDC_CLIENT_SECRET && process.env.OIDC_REDIRECT_URI
);

const getMetadata = async () => {
  const issuer = process.env.OIDC_ISSUER.replace(/\/$/, '');
  const issuerUrl = new URL(issuer);
  if (process.env.NODE_ENV === 'production' && issuerUrl.protocol !== 'https:') {
    throw new Error('The identity provider issuer must use HTTPS in production.');
  }
  const response = await fetch(`${issuer}/.well-known/openid-configuration`, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('The identity provider discovery endpoint is unavailable.');
  const metadata = await response.json();
  if (metadata.issuer?.replace(/\/$/, '') !== issuer) throw new Error('Identity provider issuer did not match its discovery document.');
  return metadata;
};

export const createOidcAuthorization = async () => {
  if (!isOidcConfigured()) throw new Error('Institutional single sign-on is not configured.');
  const metadata = await getMetadata();
  const state = crypto.randomBytes(24).toString('base64url');
  const nonce = crypto.randomBytes(24).toString('base64url');
  const codeVerifier = crypto.randomBytes(48).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  const signedState = jwt.sign({ state, nonce, codeVerifier }, secret(), { expiresIn: '10m', issuer: 'hostguard' });
  const url = new URL(metadata.authorization_endpoint);
  url.search = new URLSearchParams({
    client_id: process.env.OIDC_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.OIDC_REDIRECT_URI,
    scope: process.env.OIDC_SCOPES || 'openid email profile',
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  }).toString();
  return { authorizationUrl: url.toString(), signedState };
};

export const completeOidcAuthorization = async ({ code, state, signedState }) => {
  if (!isOidcConfigured()) throw new Error('Institutional single sign-on is not configured.');
  const expected = jwt.verify(signedState || '', secret(), { issuer: 'hostguard' });
  if (!state || state !== expected.state) throw new Error('Single sign-on state validation failed.');
  const metadata = await getMetadata();
  const tokenResponse = await fetch(metadata.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.OIDC_REDIRECT_URI,
      client_id: process.env.OIDC_CLIENT_ID,
      client_secret: process.env.OIDC_CLIENT_SECRET,
      code_verifier: expected.codeVerifier
    }),
    signal: AbortSignal.timeout(10000)
  });
  if (!tokenResponse.ok) throw new Error('The identity provider rejected the sign-in exchange.');
  const tokens = await tokenResponse.json();
  if (!tokens.id_token) throw new Error('The identity provider did not return an ID token.');

  const unverified = jwt.decode(tokens.id_token, { complete: true });
  const kid = unverified?.header?.kid;
  const supportedAlgorithms = ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512'];
  if (!kid || !supportedAlgorithms.includes(unverified.header.alg)) throw new Error('The identity provider returned an unsupported signing key.');
  const jwksResponse = await fetch(metadata.jwks_uri, { signal: AbortSignal.timeout(10000) });
  if (!jwksResponse.ok) throw new Error('Could not retrieve identity provider signing keys.');
  const { keys = [] } = await jwksResponse.json();
  const jwk = keys.find((key) => key.kid === kid && key.use !== 'enc');
  if (!jwk) throw new Error('No matching identity provider signing key was found.');
  const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const claims = jwt.verify(tokens.id_token, publicKey, {
    algorithms: supportedAlgorithms,
    issuer: metadata.issuer,
    audience: process.env.OIDC_CLIENT_ID,
    clockTolerance: 30
  });
  if (claims.nonce !== expected.nonce) throw new Error('Single sign-on nonce validation failed.');
  if (!claims.email || claims.email_verified !== true) throw new Error('The identity provider did not provide a verified email address.');
  return claims;
};
