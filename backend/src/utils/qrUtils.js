import QRCode from 'qrcode';

export const generateQRCodeDataUrl = async (payloadString) => {
  try {
    const dataUrl = await QRCode.toDataURL(payloadString, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF'
      }
    });
    return dataUrl;
  } catch (err) {
    console.error('[QR Error] Failed to generate QR data URL:', err);
    throw err;
  }
};
