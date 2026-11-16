import { isStudentDirectoryConfigured, syncStudentDirectory } from '../services/studentDirectoryService.js';

let syncInterval = null;
let running = false;

export const startDirectorySync = (intervalMs = 15 * 60 * 1000) => {
  if (!isStudentDirectoryConfigured()) {
    console.log('[HostGuard Directory Sync] Disabled; no directory endpoint is configured.');
    return;
  }
  const sync = async () => {
    if (running) return;
    running = true;
    try {
      const summary = await syncStudentDirectory();
      console.log(`[HostGuard Directory Sync] created=${summary.created} updated=${summary.updated} skipped=${summary.skipped}`);
      if (summary.errors.length) console.warn(`[HostGuard Directory Sync] ${summary.errors.length} record(s) need attention.`);
    } catch (error) {
      console.error('[HostGuard Directory Sync Error]:', error.message);
    } finally {
      running = false;
    }
  };
  if (syncInterval) clearInterval(syncInterval);
  sync();
  syncInterval = setInterval(sync, intervalMs);
};
