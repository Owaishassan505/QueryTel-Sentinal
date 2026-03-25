
/**
 * Smart Log Analyzer Engine
 * Parses raw logs and generates context-aware insights, risk scores, and human-readable narratives.
 */

export const analyzeLog = (log) => {
    // 1. Normalize Fields
    const severity = (log.severity || 'info').toLowerCase();
    const action = (log.action || 'N/A').toLowerCase();
    const message = (log.message || log.humanMessage || '').toLowerCase();
    const category = (log.category || '').toLowerCase();
    const service = (log.service || log.app || log.subtype || 'N/A').toLowerCase();

    // 🌐 SMART OVERRIDE: Check multiple fields for Source / Destination
    // We explicitly check for 'Unknown Source' string to handle legacy data in DB
    const srcRaw = log.sourceIp || log.srcip || log.remip || log.client_ip;
    const src = (srcRaw && srcRaw !== 'Unknown Source') ? srcRaw : 'Internal';

    const dstRaw = log.destIp || log.dstip || log.dst_host || log.hostname || log.parsed?.hostname;
    const dst = (dstRaw && dstRaw !== 'Unknown Destination') ? dstRaw : 'N/A';

    const port = log.dstPort || log.dstport || 'N/A';

    // 2. Base Risk Calculation
    let riskScore = 0;
    let riskLevel = 'Low Risk';
    let riskColor = 'text-blue-400';
    let urgency = 'No Action Required';

    // Severity Weights
    if (severity.includes('crit') || severity.includes('alert')) {
        riskScore = 90;
        riskLevel = 'Critical Risk';
        riskColor = 'text-red-500 animate-pulse';
        urgency = 'Immediate Action Required';
    } else if (severity.includes('error')) {
        riskScore = 75;
        riskLevel = 'High Risk';
        riskColor = 'text-red-400';
        urgency = 'Investigate Immediately';
    } else if (severity.includes('warn')) {
        riskScore = 50;
        riskLevel = 'Medium Risk';
        riskColor = 'text-amber-400';
        urgency = 'Monitor / Review';
    } else {
        riskScore = 10;
        riskLevel = 'Low Risk';
        riskColor = 'text-emerald-400';
        urgency = 'None';
    }

    // 3. Contextual Risk Modifiers

    // Mitigating Factors (Blocked Threats)
    const isBlocked = action.includes('block') || action.includes('deny') || action.includes('drop');
    if (isBlocked && riskScore > 50) {
        // Threat was prevented, so immediate technical risk is lower, but severity remains high for awareness
        urgency = 'Threat Prevented (No Action)';
        // We keep risk level high to indicate "High Severity Event", but maybe lower score slightly
        riskScore -= 10;
    }

    // Aggravating Factors (Allowed Threats)
    if (!isBlocked && riskScore > 50) {
        // High severity event was ALLOWED -> Critical Breach Potential
        riskScore += 10;
        urgency = 'CRITICAL: Threat Allowed - Investigate NOW';
        riskLevel = 'UNMITIGATED THREAT';
        riskColor = 'text-red-600 bg-red-500/20 px-2 rounded';
    }

    // 4. Narrative Generation (What / Why)
    let what = `Detected ${severity} level activity on ${service.toUpperCase()} channel.`;
    let why = `The system flagged this event based on standard logging rules.`;

    // --- Specific Scenario Checkers ---

    // SSL / TLS Issues
    if (category.includes('ssl') || service.includes('ssl') || message.includes('handshake') || message.includes('cert')) {
        what = `SSL/TLS connection issue detected between ${src} and ${dst}.`;
        why = `Likely caused by an expired certificate, mismatched cipher suite, or protocol downgrade attack attempt.`;
        if (severity.includes('error')) {
            what = `SSL Handshake Failure: Connection terminated unexpectedly.`;
            why = `Critical failure in secure channel negotiation. Could indicate a Man-in-the-Middle check or incompatible encryption.`;
        }
    }

    // IPS / Malware
    else if (category.includes('ips') || category.includes('virus') || category.includes('malware')) {
        what = `Malicious signature match detected in traffic flow from ${src}.`;
        why = `Traffic patterns matched known exploit signatures or malware definitions.`;
        if (isBlocked) {
            what = `Prevented attempted exploitation/infection from ${src}.`;
            why = `Defense systems successfully intercepted and blocked the malicious payload.`;
        }
    }

    // Failed Logins / Auth
    else if (category.includes('login') || category.includes('auth') || message.includes('authentication')) {
        if (severity.includes('error') || message.includes('fail')) {
            what = `Authentication failure detected for user/device at ${src}.`;
            why = `Incorrect credentials or invalid authentication method used. Repeated failures may indicate brute-force.`;
        } else {
            what = `Successful authentication detected from ${src}.`;
            why = `User/Device successfully verified identity tokens.`;
        }
    }

    // Web Filter
    else if (category.includes('web')) {
        what = `Web access ${isBlocked ? 'blocked' : 'logged'} for destination ${dst}.`;
        why = `Request matched web filtering category policy (e.g. Gambling, Adult, malicious).`;
    }

    // VPN
    else if (category.includes('vpn')) {
        if (action.includes('error') || severity.includes('error')) {
            what = `VPN Tunnel negotiation failed for gateway ${src}.`;
            why = `Phase 1/2 mismatch or connectivity loss.`;
        } else {
            what = `VPN Tunnel active/negotiated successfully.`;
            why = `Secure remote access channel established.`;
        }
    }

    // Fallback for Errors without specific category
    else if (riskScore >= 70) {
        what = `High Severity System Event: ${message || 'Unknown Error Scenario'}`;
        why = `An operational error or system fault was flagged which requires attention.`;
    }


    return {
        what,
        why,
        isThreat: riskLevel,
        action: urgency,
        riskColor,
        riskScore
    };
};
