// src/api/api.js
import { backendURL } from "../config";

export async function apiFetch(path, options = {}) {
    const token = localStorage.getItem("token");

    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    let response;

    try {
        response = await fetch(`${backendURL}${path}`, {
            ...options,
            headers,
        });
    } catch (err) {
        console.error("❌ Network error:", err);
        throw new Error("SERVER_OFFLINE");
    }

    // If API returns HTML (404 → React), stop parsing JSON
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
        console.error("❌ API returned non-JSON response:", response.status);
        return { ok: false, status: response.status, data: null };
    }

    let data;
    try {
        data = await response.json();
    } catch (err) {
        console.error("❌ JSON parse error:", err);
        data = null;
    }

    return { ok: response.ok, status: response.status, data };
}

// Fetch INFO logs
export async function getInfoLogs() {
    return apiFetch("/api/logs/info");
}

// Fetch ERROR logs
export async function getErrorLogs() {
    return apiFetch("/api/logs/error");
}

// Fetch WARNING logs
export async function getWarningLogs() {
    return apiFetch("/api/logs/warning");
}
