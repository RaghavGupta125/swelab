# HostGuard Deployment & Setup Guide (docs/DEPLOYMENT.md)

## 1. Prerequisites
- **Node.js**: v18.0.0 or higher (Tested on Node v22.14.0)
- **MongoDB**: Local MongoDB instance (running on port 27017) or MongoDB Atlas connection URI
- **Git**

---

## 2. Quick Local Setup

1. **Clone repository and navigate to folder:**
   ```bash
   git clone <repo-url>
   cd swelab
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env if required (default points to mongodb://localhost:27017/hostguard)
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   npm run build
   ```

4. **Seed Demonstration Data:**
   ```bash
   cd ..
   npm run seed
   ```

5. **Run Full-Stack Application:**
   ```bash
   # From root:
   npm start
   ```
   Open your browser at: `http://localhost:5000`

---

## 3. Running Development Mode with Hot Reload

If you wish to develop frontend and backend separately with Vite HMR:
- **Terminal 1 (Backend):**
  ```bash
  npm run dev:backend
  ```
- **Terminal 2 (Frontend):**
  ```bash
  npm run dev:frontend
  ```
  Open `http://localhost:5173` (proxied to API at port 5000).

---

## 4. Running Automated Tests

To run the complete automated test suite (covering BR-001 through BR-012, API integration, quotas, and gate lifecycle):
```bash
npm test
```

---

## 5. Production Cloud Deployment

### Backend (Render / Railway / Fly.io / AWS EC2)
1. Set the following environment variables:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/hostguard?retryWrites=true&w=majority`
   - `JWT_SECRET=<strong-random-secret>`
   - `CLIENT_URL=https://<your-frontend-domain>`
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_USER=<your-email>`
   - `SMTP_PASS=<your-app-password>`
2. Build command:
   ```bash
   npm run build
   ```
3. Start command:
   ```bash
   npm start
   ```

### Frontend (Vercel / Netlify / Cloudflare Pages)
If deploying frontend independently:
1. Root directory: `frontend`
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set `VITE_API_BASE_URL=https://<your-backend-api-domain>`
