/**
 * Render Background Worker Service for PGPx Student Portal
 * - 24-Hour Anonymous Chat Purge Engine
 * - Realtime Deadline Alert Scanner (Assignments & Reminders)
 * - Expired Link Archival
 * - Render Health Check HTTP Server (GET /health)
 */

import http from "http";
import { config } from "dotenv";
config();

const PORT = process.env.WORKER_PORT || process.env.PORT || 4000;
const CRON_SECRET = process.env.CRON_SECRET || "pgpx_worker_cron_secret_auth_token_9999";
const PORTAL_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

console.log(`[Worker] Starting PGPx Background Worker on port ${PORT}...`);

// Job 1: 24-Hour Anonymous Chat Purge
async function runChatPurgeJob() {
  try {
    const res = await fetch(`${PORTAL_URL}/api/chat/purge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CRON_SECRET}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`[Worker - Chat Purge] Executed successfully: purged ${data.purged_count} messages.`);
    } else {
      console.warn(`[Worker - Chat Purge] HTTP status ${res.status}`);
    }
  } catch (err) {
    // Portal might be booting
    console.error(`[Worker - Chat Purge] Note: ${err.message}`);
  }
}

// Job 2: Deadline Alert Scanner (3 days, 1 day, 3 hours, 30 min)
async function runDeadlineScannerJob() {
  try {
    const res = await fetch(`${PORTAL_URL}/api/worker/scan-deadlines`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CRON_SECRET}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`[Worker - Deadline Scanner] Scanned deadlines: dispatched ${data.dispatched_count} alerts.`);
    }
  } catch (err) {
    console.error(`[Worker - Deadline Scanner] Note: ${err.message}`);
  }
}

// Job 3: Expired Links Auto-Archival
async function runArchiveExpiredLinksJob() {
  try {
    const res = await fetch(`${PORTAL_URL}/api/links/archive-expired`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CRON_SECRET}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.archived_count > 0) {
        console.log(`[Worker - Links] Archived ${data.archived_count} expired links.`);
      }
    }
  } catch (err) {
    // silent
  }
}

// Schedule recurring loops
const CHAT_PURGE_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes
const DEADLINE_SCAN_INTERVAL_MS = 60 * 1000; // every 1 minute
const ARCHIVE_LINKS_INTERVAL_MS = 15 * 60 * 1000; // every 15 minutes

setInterval(runChatPurgeJob, CHAT_PURGE_INTERVAL_MS);
setInterval(runDeadlineScannerJob, DEADLINE_SCAN_INTERVAL_MS);
setInterval(runArchiveExpiredLinksJob, ARCHIVE_LINKS_INTERVAL_MS);

// Run initial execution immediately after startup
setTimeout(() => {
  runChatPurgeJob();
  runDeadlineScannerJob();
  runArchiveExpiredLinksJob();
}, 5000);

// Health Check Server for Render
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "healthy",
        service: "pgpx-worker",
        uptime_seconds: process.uptime(),
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  if (req.method === "POST" && url.pathname === "/trigger-purge") {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }
    runChatPurgeJob();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ triggered: true }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not Found" }));
});

server.listen(PORT, () => {
  console.log(`[Worker] Health check listener active at http://localhost:${PORT}/health`);
});
