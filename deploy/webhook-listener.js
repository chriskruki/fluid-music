#!/usr/bin/env node

/**
 * GitHub Webhook Listener for Auto-Deployment
 * Listens for push events from GitHub and triggers deployment
 */

const http = require("http");
const crypto = require("crypto");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

// Configuration
const CONFIG = {
  port: process.env.WEBHOOK_PORT || 9000,
  secret: process.env.GITHUB_WEBHOOK_SECRET || "",
  repoPath: process.env.REPO_PATH || path.join(__dirname, ".."),
  deployScript: path.join(__dirname, "deploy.sh"),
  logFile: path.join(__dirname, "deploy.log"),
};

/**
 * Log message with timestamp
 */
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());

  // Append to log file
  fs.appendFileSync(CONFIG.logFile, logMessage, "utf8");
}

/**
 * Verify GitHub webhook signature
 */
function verifySignature(payload, signature) {
  if (!CONFIG.secret) {
    log(
      "WARNING: No webhook secret configured. Skipping signature verification."
    );
    return true;
  }

  const hmac = crypto.createHmac("sha256", CONFIG.secret);
  const digest = "sha256=" + hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

/**
 * Execute deployment script
 */
function deploy(branch, ref) {
  log(`Starting deployment for branch: ${branch} (ref: ${ref})`);

  return new Promise((resolve, reject) => {
    const deployProcess = exec(
      `bash "${CONFIG.deployScript}" "${branch}" "${ref}"`,
      {
        cwd: CONFIG.repoPath,
        env: {
          ...process.env,
          BRANCH: branch,
          REF: ref,
        },
      },
      (error, stdout, stderr) => {
        if (error) {
          log(`Deployment failed: ${error.message}`);
          log(`STDOUT: ${stdout}`);
          log(`STDERR: ${stderr}`);
          reject(error);
        } else {
          log(`Deployment completed successfully`);
          log(`STDOUT: ${stdout}`);
          if (stderr) {
            log(`STDERR: ${stderr}`);
          }
          resolve(stdout);
        }
      }
    );

    // Stream output in real-time
    deployProcess.stdout.on("data", (data) => {
      process.stdout.write(data);
    });

    deployProcess.stderr.on("data", (data) => {
      process.stderr.write(data);
    });
  });
}

/**
 * HTTP server to handle webhook requests
 */
const server = http.createServer((req, res) => {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "text/plain" });
    res.end("Method Not Allowed");
    return;
  }

  if (req.url !== "/webhook") {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
    return;
  }

  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    try {
      // Verify signature if secret is configured
      const signature = req.headers["x-hub-signature-256"];
      if (CONFIG.secret && signature) {
        if (!verifySignature(body, signature)) {
          log("ERROR: Invalid webhook signature");
          res.writeHead(401, { "Content-Type": "text/plain" });
          res.end("Unauthorized");
          return;
        }
      }

      const payload = JSON.parse(body);
      const event = req.headers["x-github-event"];

      log(`Received ${event} event`);

      // Handle push events
      if (event === "push") {
        const branch = payload.ref.replace("refs/heads/", "");
        const ref = payload.ref;
        const pusher = payload.pusher?.name || "unknown";
        const commits = payload.commits?.length || 0;

        log(
          `Push detected: ${pusher} pushed ${commits} commit(s) to ${branch}`
        );

        // Trigger deployment asynchronously
        deploy(branch, ref)
          .then(() => {
            log(`Deployment for ${branch} completed successfully`);
          })
          .catch((error) => {
            log(`Deployment for ${branch} failed: ${error.message}`);
          });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "accepted",
            branch,
            message: "Deployment triggered",
          })
        );
      } else {
        log(`Ignoring event type: ${event}`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "ignored",
            event,
            message: "Only push events trigger deployment",
          })
        );
      }
    } catch (error) {
      log(`ERROR processing webhook: ${error.message}`);
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Bad Request");
    }
  });

  req.on("error", (error) => {
    log(`ERROR reading request: ${error.message}`);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  });
});

// Start server
server.listen(CONFIG.port, () => {
  log(`Webhook listener started on port ${CONFIG.port}`);
  log(
    `Listening for GitHub push events at http://0.0.0.0:${CONFIG.port}/webhook`
  );
  if (!CONFIG.secret) {
    log(
      "WARNING: GITHUB_WEBHOOK_SECRET not set. Webhook signature verification is disabled."
    );
  }
});

// Handle errors
server.on("error", (error) => {
  log(`Server error: ${error.message}`);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  log("Received SIGTERM, shutting down gracefully");
  server.close(() => {
    log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  log("Received SIGINT, shutting down gracefully");
  server.close(() => {
    log("Server closed");
    process.exit(0);
  });
});
