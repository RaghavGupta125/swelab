import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';
import { startScheduler } from './jobs/scheduler.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    // Start background overstay and timeout scheduler
    startScheduler(30000); // scan every 30 seconds

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 HostGuard Server running on port ${PORT}`);
      console.log(`🏛️ Institution: The LNM Institute of Information Technology`);
      console.log(`📘 Course: CS314 Software Development Lab | Team T049`);
      console.log(`🌐 Base URL: http://localhost:${PORT}`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('[HostGuard Server Startup Error]:', err.message);
    process.exit(1);
  }
};

startServer();
