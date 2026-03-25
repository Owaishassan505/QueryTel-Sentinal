/**
 * MITRE ATT&CK Mapping Engine
 * Maps raw security logs to MITRE Tactics and Techniques.
 */

const MITRE_TAXONOMY = {
    "Initial Access": {
        id: "TA0001",
        techniques: [
            { id: "T1190", name: "Exploit Public-Facing Application" },
            { id: "T1133", name: "External Remote Services" },
            { id: "T1566", name: "Phishing" }
        ]
    },
    "Execution": {
        id: "TA0002",
        techniques: [
            { id: "T1059", name: "Command and Scripting Interpreter" },
            { id: "T1204", name: "User Execution" },
            { id: "T1053", name: "Scheduled Task/Job" }
        ]
    },
    "Persistence": {
        id: "TA0003",
        techniques: [
            { id: "T1078", name: "Valid Accounts" },
            { id: "T1136", name: "Create Account" },
            { id: "T1543", name: "Create or Modify System Process" }
        ]
    },
    "Privilege Escalation": {
        id: "TA0004",
        techniques: [
            { id: "T1068", name: "Exploitation for Privilege Escalation" },
            { id: "T1548", name: "Abuse Privilege Escalation Mechanism" }
        ]
    },
    "Defense Evasion": {
        id: "TA0005",
        techniques: [
            { id: "T1562", name: "Impair Defenses" },
            { id: "T1070", name: "Indicator Removal on Host" },
            { id: "T1036", name: "Masquerading" }
        ]
    },
    "Credential Access": {
        id: "TA0006",
        techniques: [
            { id: "T1110", name: "Brute Force" },
            { id: "T1555", name: "Credentials from Password Stores" },
            { id: "T1003", name: "OS Credential Dumping" }
        ]
    },
    "Discovery": {
        id: "TA0007",
        techniques: [
            { id: "T1087", name: "Account Discovery" },
            { id: "T1018", name: "Remote System Discovery" },
            { id: "T1046", name: "Network Service Scanning" }
        ]
    },
    "Lateral Movement": {
        id: "TA0008",
        techniques: [
            { id: "T1021", name: "Remote Services" },
            { id: "T1570", name: "Lateral Tool Transfer" }
        ]
    },
    "Command and Control": {
        id: "TA0011",
        techniques: [
            { id: "T1071", name: "Application Layer Protocol" },
            { id: "T1573", name: "Encrypted Channel" },
            { id: "T1105", name: "Ingress Tool Transfer" }
        ]
    },
    "Exfiltration": {
        id: "TA0010",
        techniques: [
            { id: "T1041", name: "Exfiltration Over C2 Channel" },
            { id: "T1048", name: "Exfiltration Over Alternative Protocol" }
        ]
    },
    "Impact": {
        id: "TA0040",
        techniques: [
            { id: "T1486", name: "Data Encrypted for Impact" },
            { id: "T1490", name: "Inhibit System Recovery" },
            { id: "T1498", name: "Network Denial of Service" }
        ]
    }
};

/**
 * Maps a log document to one or more MITRE techniques
 */
export function mapLogToMitre(log) {
    const techniques = [];
    const msg = (log.message || "").toLowerCase();
    const cleanMsg = (log.cleanMessage || "").toLowerCase();
    const service = (log.service || "").toLowerCase();
    const action = (log.action || "").toLowerCase();

    // 1️⃣ Credential Access (Brute Force)
    if (msg.includes("failed login") || msg.includes("brute") || service.includes("auth-failure")) {
        techniques.push({ id: "T1110", name: "Brute Force", tactic: "Credential Access" });
    }

    // 2️⃣ Persistence / Initial Access (Valid Accounts)
    if (action === "tunnel-up" || (msg.includes("login success") && (service.includes("vpn") || service.includes("ssh")))) {
        techniques.push({ id: "T1078", name: "Valid Accounts", tactic: "Persistence" });
    }

    // 3️⃣ Initial Access (Exploit Public Facing)
    if (msg.includes("sql injection") || msg.includes("cross site") || msg.includes("xss") || msg.includes("overflow")) {
        techniques.push({ id: "T1190", name: "Exploit Public-Facing Application", tactic: "Initial Access" });
    }

    // 4️⃣ Command and Control (C2)
    if (msg.includes("c2") || msg.includes("botnet") || msg.includes("callback") || service.includes("cnc")) {
        techniques.push({ id: "T1071", name: "Application Layer Protocol", tactic: "Command and Control" });
    }

    // 5️⃣ Impact (DoS / Ransomware)
    if (msg.includes("dos") || msg.includes("flood") || msg.includes("ransomware") || msg.includes("encrypt")) {
        techniques.push({ id: "T1498", name: "Network Denial of Service", tactic: "Impact" });
        if (msg.includes("encrypt")) techniques.push({ id: "T1486", name: "Data Encrypted for Impact", tactic: "Impact" });
    }

    // 6️⃣ Lateral Movement
    if (msg.includes("lateral") || msg.includes("smb relay") || (msg.includes("remote") && msg.includes("desktop"))) {
        techniques.push({ id: "T1021", name: "Remote Services", tactic: "Lateral Movement" });
    }

    // 7️⃣ Discovery
    if (msg.includes("scan") || msg.includes("enumerat") || msg.includes("probing")) {
        techniques.push({ id: "T1046", name: "Network Service Scanning", tactic: "Discovery" });
    }

    return techniques;
}

/**
 * Returns the full matrix structure
 */
export function getMitreMatrixStructure() {
    return MITRE_TAXONOMY;
}
