
/**
 * FortiAnalyzer-style Risk Logic
 * Returns { riskLevel, label, alertImmediate }
 */
export function calculateRiskMetadata(log) {
    const category = (log.category || '').toUpperCase();
    const severity = (log.severity || '').toUpperCase();
    const action = (log.action || '').toLowerCase();

    let riskLevel = 'LOW';
    let label = 'ROUTINE';
    let alertImmediate = false;

    // 1. Action-Aware Risk Logic (FortiAnalyzer Style)
    const isThreat = ['IPS', 'ANTIVIRUS', 'MALWARE', 'EXPLOIT'].includes(category);
    const isHighSeverity = ['ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY'].includes(severity);
    const isMitigated = ['block', 'deny', 'drop', 'reset'].includes(action);

    if (isThreat) {
        if (isHighSeverity) {
            if (!isMitigated) {
                riskLevel = 'CRITICAL';
                label = 'UNMITIGATED THREAT';
                alertImmediate = true;
                // Add '?' flag if exploit passed but success is unknown
                if (category === 'EXPLOIT') label += ' (?)';
            } else {
                riskLevel = 'HIGH';
                label = 'THREAT PREVENTED';
            }
        } else {
            riskLevel = isMitigated ? 'MEDIUM' : 'HIGH';
            label = isMitigated ? 'THREAT STOPPED' : 'THREAT DETECTED';
        }
    } else if (category === 'FAILED LOGIN') {
        riskLevel = 'HIGH';
        label = 'AUTHENTICATION FAILURE';
    } else if (isHighSeverity) {
        riskLevel = 'MEDIUM';
        label = 'SYSTEM ANOMALY';
    }

    return { riskLevel, label, alertImmediate };
}

/**
 * Noise Reduction: Should this log be dropped or stored short-term?
 */
export function isNoise(log) {
    const category = (log.category || '').toUpperCase();
    const action = (log.action || '').toLowerCase();
    const service = (log.service || '').toUpperCase();

    // Drop repetitive DNS success or allowed heartbeats if they are low severity
    if (action === 'accept' || action === 'pass') {
        if (category === 'DNS' || service === 'DNS') return true;
        if (service === 'NTP') return true;
    }

    return false;
}

/**
 * Generate a fingerprint for event correlation
 * Groups logs by: Category, Message (Signature), Source, and Destination
 */
export function generateEventFingerprint(log) {
    const category = (log.category || 'GENERAL').toUpperCase();
    const msg = (log.message || '').slice(0, 100); // Correlation usually based on signature/message start
    const src = log.sourceIp || 'INTERNAL';
    const dst = log.destIp || 'PERIMETER';

    return `${category}|${msg}|${src}|${dst}`;
}

/**
 * Generate a fingerprint for deduplication (already exists, but refined)
 */
export function generateLogFingerprint(log) {
    return `${log.deviceName}|${log.sourceIp}|${log.destIp}|${log.category}|${log.service}|${log.action}`;
}
