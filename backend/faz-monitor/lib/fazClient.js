// backend/faz-monitor/lib/fazClient.js
import fetch from "node-fetch";
import http from "http";
import https from "https";

const FAZ_URL = process.env.FAZ_URL;
const FAZ_USER = process.env.FAZ_USER;
const FAZ_PASS = process.env.FAZ_PASS;

// ✅ Choose correct agent (http vs https)
function getAgent(url) {
  if (!url) throw new Error("FAZ_URL is not defined in .env");
  return url.startsWith("https:")
    ? new https.Agent({ rejectUnauthorized: false }) // accept self-signed FAZ certs
    : new http.Agent();
}

const agent = getAgent(FAZ_URL);

let _id = 1;

async function rpc(method, url, params = {}) {
  if (!FAZ_URL || !FAZ_USER || !FAZ_PASS) {
    throw new Error("FAZ_URL / FAZ_USER / FAZ_PASS not set in .env");
  }

  const body = {
    id: _id++,
    jsonrpc: "2.0",
    method,
    params: [{ url, ...params }],
  };

  const res = await fetch(FAZ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Basic " + Buffer.from(`${FAZ_USER}:${FAZ_PASS}`).toString("base64"),
    },
    body: JSON.stringify(body),
    agent,
  });

  const text = await res.text();

  try {
    const json = JSON.parse(text);
    if (json.error) throw new Error(JSON.stringify(json.error));
    return json.result?.[0]?.data ?? json.result;
  } catch (e) {
    throw new Error(
      `FAZ RPC failed. Response was not JSON:\n${text.substring(0, 200)}...`
    );
  }
}

// ✅ Fetch high/critical events from FAZ
export async function fetchRecentHighEvents(adom, sinceEpoch, limit = 200) {
  const url = `/logview/adom/${adom}/query`;
  const query = {
    filter: [
      ["severity", "in", ["high", "critical"]],
      ["itime", "range", [sinceEpoch, Math.floor(Date.now() / 1000)]],
    ],
    order_by: [{ field: "itime", direction: "asc" }],
    limit,
  };
  return rpc("get", url, { query });
}

export { rpc };
