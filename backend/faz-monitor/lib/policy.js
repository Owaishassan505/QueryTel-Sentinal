// lib/policy.js
// Utility functions for FAZ event processing

/**
 * Normalize a FortiAnalyzer log row into a common event format
 */
export function normalizeEventRow(row) {
    const sev = String(row.severity || "").toLowerCase();
    const subtype = String(row.subtype || row.type || "event").toLowerCase();
    const msg = row.msg || row.message || row.event || "Security event";
    const tsec = row.itime || row.etime || Math.floor(Date.now() / 1000);

    return {
        ts: new Date(tsec * 1000),
        source: {
            device: row.devname || row.device || "unknown",
            adom: row.adom || "root"
        },
        event: {
            type: subtype,
            severity: sev,
            message: msg,
            fields: row
        }
    };
}

/**
 * Decide if an event should trigger an alert.
 */
export function shouldAlert(ev) {
    if (!ev) return false;
    if (ev.severity && ["high", "critical"].includes(ev.severity.toLowerCase())) {
        return true;
    }
    if (ev.subtype && ["virus", "attack", "anomaly"].includes(ev.subtype.toLowerCase())) {
        return true;
    }
    return false;
}

/**
 * Generate a fingerprint for an alert to avoid duplicates
 */
export function fingerprintAlert(ev) {
    return `${ev.source.device}:${ev.event.type}:${ev.event.message}:${ev.event.severity}`;
}

/**
 * Decide if an alert should create a new Zoho ticket
 */
export function shouldCreateTicket(ev) {
    return shouldAlert(ev); // for now: same logic as shouldAlert
}
