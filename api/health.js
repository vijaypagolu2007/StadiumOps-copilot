import { json } from "./_shared.js";

export default function handler(req, res) {
  json(res, 200, {
    status: "ok",
    service: "stadiumops-copilot",
    version: process.env.VERCEL_GIT_COMMIT_SHA || "local",
    region: process.env.VERCEL_REGION || "local",
    uptimeSeconds: Math.round(process.uptime())
  });
}
