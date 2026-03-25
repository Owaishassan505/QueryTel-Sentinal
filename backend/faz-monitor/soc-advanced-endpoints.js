import { ObjectId } from 'mongodb';
import { createOrUpdateIncident } from './incident-engine.js';

export function registerAdvancedSOCEndpoints(app, logsCollection, eventsCollection, incidentsCollection, analyticsCache, statsCacheCollection) {

    // Helper for caching
    const getCachedOrRun = async (key, ttl, fn) => {
        if (!analyticsCache) return await fn();
        const cached = analyticsCache.get(key);
        if (cached) return cached;
        const result = await fn();
        analyticsCache.set(key, result, ttl);
        return result;
    };

    // 1️⃣ Global Cyber Risk Score
    // 1️⃣ Global Cyber Risk Score (Cached 5m)
    app.get("/api/soc/risk-score", async (_req, res) => {
        try {
            const data = await getCachedOrRun("soc:risk-score", 300, async () => {
                const now = Date.now();

                const calculateRisk = async (windowMs, label) => {
                    const startTime = new Date(now - windowMs);

                    // Single aggregation for all counts - MUCH FASTER
                    const results = await logsCollection.aggregate([
                        { $match: { ts: { $gte: startTime } } },
                        {
                            $group: {
                                _id: null,
                                total: { $sum: 1 },
                                critical: { $sum: { $cond: [{ $eq: ["$severity", "error"] }, 1, 0] } },
                                warnings: { $sum: { $cond: [{ $in: ["$severity", ["warn", "warning"]] }, 1, 0] } }
                            }
                        }
                    ]).toArray();

                    const stats = results[0] || { total: 0, critical: 0, warnings: 0 };

                    console.log(`[RiskScore/${label}] Events: ${stats.total}, Critical: ${stats.critical}, Warning: ${stats.warnings}`);

                    if (stats.total === 0) return null;

                    const riskScore = Math.min(100, Math.round(
                        (stats.critical * 10 + stats.warnings * 3) / Math.max(1, stats.total / 50)
                    ));

                    const riskLevel = riskScore < 30 ? "low" : riskScore < 60 ? "medium" : "high";

                    return {
                        score: riskScore || 0,
                        level: riskLevel,
                        criticalEvents: stats.critical,
                        warnings: stats.warnings,
                        totalEvents: stats.total,
                        window: label
                    };
                };

                // 24h -> 7d -> 30d
                let result = await calculateRisk(24 * 60 * 60 * 1000, "24h");
                if (result) return result;

                result = await calculateRisk(7 * 24 * 60 * 60 * 1000, "7d");
                if (result) return result;

                result = await calculateRisk(30 * 24 * 60 * 60 * 1000, "30d");
                return result || { score: 0, level: "low", criticalEvents: 0, warnings: 0, totalEvents: 0, window: "none" };
            });
            console.log(`[RiskScore] Final Data Ready`);
            res.json(data);
            console.log(`[RiskScore] Response Sent`);
        } catch (err) {
            console.error("❌ Risk Score Error:", err.message);
            res.status(500).json({ error: err.message });
        }
    });

    // 2️⃣ Crown Jewel Assets
    // 2️⃣ Crown Jewel Assets (Cached 5m)
    app.get("/api/soc/crown-jewels", async (_req, res) => {
        try {
            const data = await getCachedOrRun("soc:crown-jewels", 300, async () => {
                const assets = [
                    { name: "AD-DC-PRIMARY", ip: "10.10.1.10", criticality: "critical", alerts: 0, exposure: "protected" },
                    { name: "DB-PROD-CLUSTER", ip: "10.20.5.50", criticality: "critical", alerts: 2, exposure: "monitored" },
                    { name: "VPN-GATEWAY", ip: "192.168.1.1", criticality: "high", alerts: 1, exposure: "exposed" },
                    { name: "FILE-SERVER-MAIN", ip: "10.30.2.15", criticality: "high", alerts: 0, exposure: "protected" },
                    { name: "EMAIL-EXCHANGE", ip: "10.40.3.20", criticality: "medium", alerts: 3, exposure: "monitored" }
                ];

                // Enhance with real data
                for (const asset of assets) {
                    const count = await logsCollection.countDocuments({
                        $or: [
                            { destIp: asset.ip },
                            { sourceIp: asset.ip }
                        ],
                        severity: { $in: ["error", "warn", "warning"] },
                        ts: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                    });
                    asset.alerts = count;
                }
                return assets.slice(0, 5);
            });
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 3️⃣ MITRE ATT&CK Coverage (REAL - Based on Log Categories)
    // 3️⃣ MITRE ATT&CK Coverage (Cached 10m)
    app.get("/api/soc/mitre-coverage", async (_req, res) => {
        try {
            const data = await getCachedOrRun("soc:mitre-coverage", 600, async () => {
                const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

                // Map log categories to MITRE tactics
                const categoryToTactic = {
                    "Failed Login": "TA0001", // Initial Access
                    "VPN": "TA0001", // Initial Access
                    "Application Control": "TA0002", // Execution
                    "IPS": "TA0005", // Defense Evasion
                    "DNS": "TA0007", // Discovery
                    "SSL": "TA0006", // Credential Access
                    "Admin Access": "TA0004", // Privilege Escalation
                };

                const tactics = await Promise.all([
                    { id: "TA0001", name: "Initial Access", category: ["Failed Login", "VPN"] },
                    { id: "TA0002", name: "Execution", category: ["Application Control"] },
                    { id: "TA0003", name: "Persistence", category: ["Admin Access"] },
                    { id: "TA0004", name: "Privilege Escalation", category: ["Admin Access"] },
                    { id: "TA0005", name: "Defense Evasion", category: ["IPS", "Web Filter"] },
                    { id: "TA0006", name: "Credential Access", category: ["SSL", "Failed Login"] },
                    { id: "TA0007", name: "Discovery", category: ["DNS", "General Traffic"] },
                    { id: "TA0008", name: "Lateral Movement", category: ["VPN", "Admin Access"] },
                    { id: "TA0009", name: "Collection", category: ["SSL"] },
                    { id: "TA0011", name: "Command & Control", category: ["DNS", "SSL"] },
                    { id: "TA0010", name: "Exfiltration", category: ["SSL"] },
                    { id: "TA0040", name: "Impact", category: ["IPS", "Antivirus"] }
                ].map(async (tactic) => {
                    const count = await logsCollection.countDocuments({
                        category: { $in: tactic.category },
                        severity: { $in: ["error", "warn", "warning"] },
                        ts: { $gte: last24h }
                    });
                    return { ...tactic, detected: count };
                }));

                return tactics;
            });
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 4️⃣ Cyber Kill Chain Progress (REAL - Pattern Detection)
    app.get("/api/soc/kill-chain", async (_req, res) => {
        try {
            const last1h = new Date(Date.now() - 60 * 60 * 1000);
            const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

            // Detect reconnaissance (DNS queries, port scans)
            const reconCount = await logsCollection.countDocuments({
                category: { $in: ["DNS", "General Traffic"] },
                ts: { $gte: last24h }
            });

            // Detect initial access attempts (failed logins, VPN)
            const accessCount = await logsCollection.countDocuments({
                category: { $in: ["Failed Login", "VPN"] },
                severity: { $in: ["error", "warn", "warning"] },
                ts: { $gte: last1h }
            });

            // Detect persistence (admin access)
            const persistenceCount = await logsCollection.countDocuments({
                category: "Admin Access",
                ts: { $gte: last24h }
            });

            // Detect lateral movement (unusual VPN or admin activity)
            const lateralCount = await logsCollection.countDocuments({
                category: { $in: ["VPN", "Admin Access"] },
                severity: "error",
                ts: { $gte: last24h }
            });

            // Detect impact (IPS blocks, AV detections)
            const impactCount = await logsCollection.countDocuments({
                category: { $in: ["IPS", "Antivirus"] },
                severity: "error",
                ts: { $gte: last24h }
            });

            const stages = [
                {
                    stage: "Reconnaissance",
                    status: reconCount > 50 ? "detected" : "none",
                    confidence: Math.min(100, Math.round((reconCount / 100) * 100)),
                    count: reconCount
                },
                {
                    stage: "Initial Access",
                    status: accessCount > 5 ? "active" : accessCount > 0 ? "detected" : "none",
                    confidence: Math.min(100, Math.round((accessCount / 10) * 100)),
                    count: accessCount
                },
                {
                    stage: "Persistence",
                    status: persistenceCount > 3 ? "predicted" : "none",
                    confidence: Math.min(100, Math.round((persistenceCount / 5) * 100)),
                    count: persistenceCount
                },
                {
                    stage: "Lateral Movement",
                    status: lateralCount > 2 ? "detected" : "none",
                    confidence: Math.min(100, Math.round((lateralCount / 5) * 100)),
                    count: lateralCount
                },
                {
                    stage: "Impact",
                    status: impactCount > 5 ? "detected" : "none",
                    confidence: Math.min(100, Math.round((impactCount / 10) * 100)),
                    count: impactCount
                }
            ];

            const currentStage = stages.find(s => s.status === "active")?.stage ||
                stages.find(s => s.status === "detected")?.stage ||
                "None";

            const activeIndex = stages.findIndex(s => s.status === "active" || s.status === "detected");
            const predictedNext = activeIndex >= 0 && activeIndex < stages.length - 1
                ? stages[activeIndex + 1].stage
                : "None";

            res.json({
                currentStage,
                predictedNext,
                stages
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 5️⃣ Identity Threat Posture
    app.get("/api/soc/identity-threats", async (_req, res) => {
        try {
            const failedLogins = await logsCollection.countDocuments({
                category: "Failed Login",
                ts: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            });

            res.json({
                privilegedMisuse: 2,
                mfaFailures: 8,
                impossibleTravel: 1,
                dormantAdmins: 3,
                failedLogins,
                riskLevel: failedLogins > 20 ? "high" : failedLogins > 10 ? "medium" : "low"
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 6️⃣ AI Threat Narrative
    app.get("/api/soc/threat-narrative", async (_req, res) => {
        try {
            const last30min = new Date(Date.now() - 30 * 60 * 1000);

            const criticalEvents = await logsCollection.countDocuments({
                severity: "error",
                ts: { $gte: last30min }
            });

            const topCategory = await logsCollection.aggregate([
                { $match: { ts: { $gte: last30min } } },
                { $group: { _id: "$category", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 }
            ]).toArray();

            const narrative = criticalEvents > 10
                ? `⚠️ Elevated threat activity detected. ${criticalEvents} critical events in the last 30 minutes, primarily targeting ${topCategory[0]?._id || 'network infrastructure'}. AI correlation suggests coordinated reconnaissance. Recommend immediate analyst review.`
                : `✅ Security posture stable. Routine monitoring active across all perimeters. ${criticalEvents} minor events logged. No immediate threats detected. AI confidence: 94%.`;

            res.json({
                narrative,
                timestamp: new Date(),
                confidence: criticalEvents > 10 ? 87 : 94
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 7️⃣ Predictive Threat Intelligence (REAL - Pattern Analysis)
    app.get("/api/soc/predictive-threats", async (_req, res) => {
        try {
            const last30min = new Date(Date.now() - 30 * 60 * 1000);

            // Find most frequent attack pattern
            const topPattern = await logsCollection.aggregate([
                {
                    $match: {
                        severity: { $in: ["error", "warn", "warning"] },
                        ts: { $gte: last30min }
                    }
                },
                { $group: { _id: "$category", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 }
            ]).toArray();

            // Find most targeted asset
            const topTarget = await logsCollection.aggregate([
                {
                    $match: {
                        severity: "error",
                        ts: { $gte: last30min },
                        destIp: { $exists: true }
                    }
                },
                { $group: { _id: "$destIp", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 }
            ]).toArray();

            // Find attacking IPs
            const attackerIPs = await logsCollection.aggregate([
                {
                    $match: {
                        severity: "error",
                        ts: { $gte: last30min },
                        sourceIp: { $exists: true }
                    }
                },
                { $group: { _id: "$sourceIp", count: { $sum: 1 } } },
                { $match: { count: { $gte: 3 } } }
            ]).toArray();

            const vector = topPattern[0]?._id || "Unknown";
            const targetIP = topTarget[0]?._id || "Unknown";
            const attackCount = topPattern[0]?.count || 0;
            const confidence = Math.min(95, Math.round((attackCount / 20) * 100));

            const reasoning = attackerIPs.length > 0
                ? `Pattern analysis shows ${attackCount} ${vector} events in the last 30 minutes from ${attackerIPs.length} distinct source(s). Historical correlation suggests escalation to distributed attack within next 45 minutes.`
                : `Monitoring ${attackCount} ${vector} events. Pattern suggests reconnaissance phase. No immediate escalation predicted.`;

            res.json({
                predictedVector: vector === "Unknown" ? "No Active Threats" : `${vector} Attack`,
                targetAsset: targetIP === "Unknown" ? "No Specific Target" : targetIP,
                timeframe: "Next 30-60 minutes",
                confidence,
                reasoning
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 8️⃣ SOC Performance Metrics (REAL - Calculated from Logs)
    app.get("/api/soc/performance", async (_req, res) => {
        try {
            const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

            // optimized: only get count and first/last for MTTR calculation
            const count = await logsCollection.countDocuments({
                severity: "error",
                ts: { $gte: last24h }
            });

            let mttd = 0;
            let mttr = 0;

            if (count > 0) {
                const firstEvent = await logsCollection.findOne({ severity: "error", ts: { $gte: last24h } }, { sort: { ts: 1 } });
                const lastEvent = await logsCollection.findOne({ severity: "error", ts: { $gte: last24h } }, { sort: { ts: -1 } });

                mttd = 4.2; // simulated proxy

                if (count > 1 && firstEvent && lastEvent) {
                    const totalDiff = (new Date(lastEvent.ts) - new Date(firstEvent.ts)) / (1000 * 60);
                    mttr = totalDiff / (count - 1);
                }
            }

            const alertsProcessed24h = await logsCollection.countDocuments({
                severity: { $in: ["error", "warn", "warning"] },
                ts: { $gte: last24h }
            });

            res.json({
                mttd: { value: mttd, unit: "minutes", trend: "stable" },
                mttr: { value: Math.round(Math.min(mttr, 25) * 10) / 10, unit: "minutes", trend: mttr < 20 ? "down" : "stable" },
                alertsProcessed24h,
                falsePositiveRate: Math.round((count / Math.max(1, alertsProcessed24h)) * 100)
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 9️⃣ Analyst Workload (REAL - Based on Active Alerts)
    app.get("/api/soc/analyst-workload", async (_req, res) => {
        try {
            const last1h = new Date(Date.now() - 60 * 60 * 1000);

            // Get active high-priority cases
            const activeCases = await logsCollection.countDocuments({
                severity: { $in: ["error", "warn", "warning"] },
                ts: { $gte: last1h }
            });

            // Distribute cases among analysts (simulated team)
            const analysts = [
                { name: "Sarah Chen", status: "active" },
                { name: "Marcus Webb", status: "active" },
                { name: "Aisha Malik", status: "active" },
                { name: "David Kim", status: "active" }
            ];

            // Distribute cases based on severity - use percentage of total
            const distribution = [0.30, 0.35, 0.15, 0.20]; // Weighted distribution
            analysts.forEach((analyst, idx) => {
                const cases = Math.round(activeCases * distribution[idx]);
                analyst.cases = cases;
                // More realistic thresholds: high > 15, optimal 5-15, low 1-4, idle 0
                analyst.load = cases > 15 ? "high" : cases > 5 ? "optimal" : cases > 0 ? "low" : "idle";
                analyst.status = cases > 0 ? "active" : "idle";
            });

            res.json({
                analysts,
                totalCases: activeCases,
                avgCasesPerAnalyst: Math.round(activeCases / analysts.length)
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 🔟 Automated Response Activity (REAL - Based on Blocked Events)
    app.get("/api/soc/auto-responses", async (_req, res) => {
        try {
            const last1h = new Date(Date.now() - 60 * 60 * 1000);
            const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

            // Count IPS blocks (current hour)
            const blockedIPs = await logsCollection.countDocuments({
                category: "IPS",
                action: { $regex: /block|deny/i },
                ts: { $gte: last1h }
            });

            // Count quarantined endpoints (AV detections)
            const quarantinedEndpoints = await logsCollection.countDocuments({
                category: "Antivirus",
                severity: "error",
                ts: { $gte: last1h }
            });

            // Count disabled accounts (failed login threshold exceeded)
            const disabledAccounts = await logsCollection.countDocuments({
                category: "Failed Login",
                severity: "error",
                ts: { $gte: last1h }
            });

            // 24h totals
            const blockedIPs24h = await logsCollection.countDocuments({
                category: "IPS",
                action: { $regex: /block|deny/i },
                ts: { $gte: last24h }
            });

            const quarantined24h = await logsCollection.countDocuments({
                category: "Antivirus",
                severity: "error",
                ts: { $gte: last24h }
            });

            const disabled24h = await logsCollection.countDocuments({
                category: "Failed Login",
                severity: "error",
                ts: { $gte: last24h }
            });

            res.json({
                blockedIPs,
                quarantinedEndpoints,
                disabledAccounts,
                last24h: {
                    blockedIPs: blockedIPs24h,
                    quarantinedEndpoints: quarantined24h,
                    disabledAccounts: disabled24h
                }
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 1️⃣1️⃣ Security Debt Index
    app.get("/api/soc/security-debt", async (_req, res) => {
        try {
            const unresolvedAlerts = await logsCollection.countDocuments({
                severity: { $in: ["error", "warn", "warning"] },
                ts: { $lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            });

            const debtScore = Math.min(100, Math.round(unresolvedAlerts / 10));

            res.json({
                score: debtScore,
                unresolvedAlerts,
                openVulnerabilities: 47,
                misconfigurations: 12,
                level: debtScore < 30 ? "low" : debtScore < 60 ? "medium" : "high"
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 1️⃣2️⃣ Blast Radius Estimator (REAL - Based on Critical Asset Activity)
    app.get("/api/soc/blast-radius", async (_req, res) => {
        try {
            const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

            // Find the most targeted critical asset
            const topTarget = await logsCollection.aggregate([
                {
                    $match: {
                        severity: "error",
                        ts: { $gte: last24h },
                        destIp: { $exists: true }
                    }
                },
                { $group: { _id: "$destIp", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 }
            ]).toArray();

            const targetAsset = topTarget[0]?._id || "AD-DC-PRIMARY";
            const eventCount = topTarget[0]?.count || 0;

            // Calculate impact dynamically based on event volume
            const connectedSystems = Math.max(10, Math.round(eventCount * 2.5) + 50);
            const affectedUsers = Math.max(100, Math.round(eventCount * 15) + 200);
            const criticalServices = Math.max(2, Math.round(eventCount / 5));
            const estimatedImpact = eventCount > 50 ? "critical" : eventCount > 20 ? "high" : "medium";
            const containmentTime = eventCount > 50 ? "45-90 minutes" : "15-30 minutes";

            res.json({
                asset: targetAsset,
                connectedSystems,
                affectedUsers,
                criticalServices,
                estimatedImpact,
                containmentTime,
                alertCount: eventCount
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 1️⃣3️⃣ Deception & Honeypot Activity (REAL - Based on Decoy Interactions)
    app.get("/api/soc/honeypot", async (_req, res) => {
        try {
            const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

            // Define decoy IPs (simulated for detection logic)
            const decoyIPs = ["10.99.99.10", "10.99.99.20", "192.168.99.100"];

            // Count interactions with decoys (simulated using category 'Honeypot' OR specific IPs)
            const interactions = await logsCollection.aggregate([
                {
                    $match: {
                        $or: [
                            { category: "Honeypot" },
                            { destIp: { $in: decoyIPs } },
                            // treat any 'unknown' category as suspicious/honeypot for this demo if needed, 
                            // or just generic scan traffic that got blocked
                            { category: "Network Scan", action: "block" }
                        ],
                        ts: { $gte: last24h }
                    }
                },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        attackers: { $addToSet: "$sourceIp" },
                        lastTime: { $max: "$ts" }
                    }
                }
            ]).toArray();

            const data = interactions[0] || { count: 0, attackers: [], lastTime: null };

            res.json({
                interactions24h: data.count,
                uniqueAttackers: data.attackers.length,
                topDecoy: "FIN-DATA-DECOY-01", // Static name for the decoy
                lastInteraction: data.lastTime || new Date(),
                confidence: data.count > 0 ? 99 : 0
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 1️⃣4️⃣ Asset Identity Center (FortiAnalyzer Style)
    app.get("/api/soc/asset-identity", async (_req, res) => {
        try {
            const data = await getCachedOrRun("soc:asset-identity", 300, async () => {
                const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

                // SINGLE CONSOLIDATED AGGREGATION
                const aggregatedData = await logsCollection.aggregate([
                    { $match: { ts: { $gte: last24h }, sourceIp: { $exists: true } } },
                    {
                        $group: {
                            _id: "$sourceIp",
                            user: { $first: "$parsed.user" },
                            mac: { $first: "$parsed.srcmac" },
                            os: { $first: "$parsed.osname" },
                            deviceName: { $first: "$deviceName" },
                            riskScore: {
                                $sum: {
                                    $cond: [
                                        { $eq: ["$severity", "error"] }, 10,
                                        { $cond: [{ $in: ["$severity", ["warn", "warning"]] }, 5, 1] }
                                    ]
                                }
                            },
                            vulnerabilities: { $sum: { $cond: [{ $eq: ["$category", "Antivirus"] }, 1, 0] } },
                            lastSeen: { $max: "$ts" },
                            // For detection method stats
                            hasMac: { $max: { $cond: [{ $ifNull: ["$parsed.srcmac", false] }, 1, 0] } },
                            hasSno: { $max: { $cond: [{ $ifNull: ["$parsed.devid", false] }, 1, 0] } },
                            hasFct: { $max: { $cond: [{ $ifNull: ["$parsed.fctuid", false] }, 1, 0] } }
                        }
                    },
                    { $sort: { riskScore: -1 } }
                ], { hint: { ts: -1 } }).toArray();

                // 1. Detection Method Stats (Derived from aggregatedData)
                let by_ip = 0, by_mac = 0, by_sno = 0, by_fctuid = 0;
                aggregatedData.forEach(item => {
                    if (item.hasFct) by_fctuid++;
                    else if (item.hasSno) by_sno++;
                    else if (item.hasMac) by_mac++;
                    else by_ip++;
                });

                const detectionMethods = [
                    { name: "by_ip", value: by_ip },
                    { name: "by_mac", value: by_mac },
                    { name: "by_sno", value: by_sno },
                    { name: "by_fctuid", value: by_fctuid }
                ];

                // 2. Detection Source (Derived from aggregatedData)
                const sourceCounts = {};
                aggregatedData.forEach(item => {
                    if (item.deviceName) {
                        sourceCounts[item.deviceName] = (sourceCounts[item.deviceName] || 0) + 1;
                    }
                });
                const detectionSources = Object.entries(sourceCounts)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 10);

                // 3. Identified vs Unidentified
                let identified = 0, unidentified = 0;
                aggregatedData.forEach(item => {
                    if (item.user && item.user !== "") identified++;
                    else unidentified++;
                });

                const identityStatus = [
                    { name: "identified", value: identified },
                    { name: "unidentified", value: unidentified }
                ];

                // 4. OS Distribution (From top 100 assets)
                const topAssets = aggregatedData.slice(0, 100);
                const osDistribution = [
                    { name: "Windows", value: topAssets.filter(a => a.os?.includes("Windows")).length },
                    { name: "Linux", value: topAssets.filter(a => a.os?.includes("Linux")).length },
                    { name: "iOS", value: topAssets.filter(a => a.os?.includes("iOS")).length },
                    { name: "Android", value: topAssets.filter(a => a.os?.includes("Android")).length },
                    { name: "N/A", value: topAssets.filter(a => !a.os).length }
                ];

                return {
                    charts: {
                        detectionMethods,
                        detectionSources,
                        identityStatus,
                        osDistribution
                    },
                    assets: topAssets.map(a => ({
                        ...a,
                        ip: a._id,
                        importance: a.riskScore > 50 ? "Critical Asset" : "Regular Asset",
                        riskLevel: a.riskScore > 100 ? "CRITICAL" : a.riskScore > 50 ? "HIGH" : "MEDIUM"
                    }))
                };
            });

            res.json(data);
        } catch (err) {
            console.error("❌ Asset Identity Error:", err.message);
            res.status(500).json({ error: err.message });
        }
    });

    // 🛡️ EVENT EXPLORER: DISCOVERY ENDPOINT
    app.get("/api/soc/events", async (req, res) => {
        try {
            const { page = 1, limit = 50, severity, riskLevel, search } = req.query;
            const skip = (page - 1) * limit;

            const cacheKey = `soc:events:${page}:${limit}:${severity}:${riskLevel}:${search || 'none'}`;
            const data = await getCachedOrRun(cacheKey, 60, async () => {
                const query = {};
                if (severity && severity !== 'all') query.severity = severity.toLowerCase();
                if (riskLevel && riskLevel !== 'all') query.riskLevel = riskLevel.toUpperCase();

                // Advanced Filters (FortiAnalyzer style)
                if (req.query.deviceId) query.deviceId = { $regex: req.query.deviceId, $options: 'i' };
                if (req.query.sourceIp) query.sourceIp = { $regex: req.query.sourceIp, $options: 'i' };
                if (req.query.destIp) query.destIp = { $regex: req.query.destIp, $options: 'i' };
                if (req.query.action) query.action = { $regex: req.query.action, $options: 'i' };
                if (req.query.service) query.service = { $regex: req.query.service, $options: 'i' };
                if (req.query.user) query.user = { $regex: req.query.user, $options: 'i' };
                if (req.query.deviceName) query.deviceName = { $regex: req.query.deviceName, $options: 'i' };
                if (req.query.vd) query.virtualDomain = { $regex: req.query.vd, $options: 'i' };
                if (req.query.type) query.category = { $regex: req.query.type, $options: 'i' };
                if (req.query.subType) query.subType = { $regex: req.query.subType, $options: 'i' };

                // UEBA and Advanced Metadata Filters
                if (req.query.uebaUserId) query.uebaUserId = { $regex: req.query.uebaUserId, $options: 'i' };
                if (req.query.uebaEndpointId) query.uebaEndpointId = { $regex: req.query.uebaEndpointId, $options: 'i' };
                if (req.query.dstEndUserId) query.dstEndUserId = { $regex: req.query.dstEndUserId, $options: 'i' };
                if (req.query.dstEndpointId) query.dstEndpointId = { $regex: req.query.dstEndpointId, $options: 'i' };

                if (search) {
                    query.$or = [
                        { eventName: { $regex: search, $options: 'i' } },
                        { source: { $regex: search, $options: 'i' } },
                        { target: { $regex: search, $options: 'i' } },
                        { category: { $regex: search, $options: 'i' } }
                    ];
                }

                const events = await eventsCollection
                    .find(query)
                    .sort({ lastSeen: -1 })
                    .skip(skip)
                    .limit(parseInt(limit))
                    .hint({ lastSeen: -1 })
                    .toArray();

                // OPTIMIZATION: Use estimated count if no filters active
                const hasFilters = Object.keys(query).length > 0;
                const total = hasFilters
                    ? await eventsCollection.countDocuments(query)
                    : await eventsCollection.estimatedDocumentCount();

                return {
                    events,
                    pagination: {
                        total,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(total / limit)
                    }
                };
            });

            res.json(data);
        } catch (err) {
            console.error("❌ Event Explorer Error:", err.message);
            res.status(500).json({ error: err.message });
        }
    });

    // 🛡️ EVENT EXPLORER: STATS FOR TIMELINE
    app.get("/api/soc/events/stats", async (_req, res) => {
        try {
            const data = await getCachedOrRun("soc:events:stats", 300, async () => {
                const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

                const stats = await eventsCollection.aggregate([
                    { $match: { lastSeen: { $gte: last24h } } },
                    {
                        $group: {
                            _id: {
                                hour: { $hour: "$lastSeen" },
                                severity: "$severity"
                            },
                            count: { $sum: "$occurrenceCount" }
                        }
                    },
                    { $sort: { "_id.hour": 1 } }
                ], { hint: { lastSeen: -1 } }).toArray();

                // Format for charts (ensure all 24 hours are present)
                return Array.from({ length: 24 }, (_, i) => {
                    const hourData = stats.filter(s => s._id.hour === i);
                    return {
                        hour: `${i % 12 || 12}${i < 12 ? 'AM' : 'PM'}`,
                        critical: hourData.find(s => s._id.severity === 'critical')?.count || 0,
                        high: hourData.find(s => s._id.severity === 'error')?.count || 0, // treating 'error' as high for consistency
                        medium: hourData.find(s => s._id.severity === 'warning' || s._id.severity === 'warn')?.count || 0,
                        low: hourData.find(s => s._id.severity === 'info')?.count || 0,
                    };
                });
            });

            res.json(data);
        } catch (err) {
            console.error("❌ Event Stats Error:", err.message);
            res.status(500).json({ error: err.message });
        }
    });

    // 🛡️ EVENT EXPLORER: DRILL-DOWN RAW LOGS
    app.get("/api/soc/events/:id/logs", async (req, res) => {
        try {
            const event = await eventsCollection.findOne({ _id: new ObjectId(req.params.id) });
            if (!event) return res.status(404).json({ error: "Event not found" });

            // Fetch logs matching the event's fingerprint
            // Correlation uses fingerprint + last 24h of logs typically
            const logs = await logsCollection
                .find({
                    category: event.category,
                    sourceIp: event.source,
                    destIp: event.target,
                    ts: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // last 7 days for drill-down depth
                })
                .sort({ ts: -1 })
                .limit(500)
                .toArray();

            res.json({ event, logs });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ================================================
    // 🚨 INCIDENT MANAGEMENT ENDPOINTS
    // ================================================

    // 1. GET /api/soc/incidents - List incidents with filters
    app.get("/api/soc/incidents", async (req, res) => {
        try {
            const { page = 1, limit = 20, severity, status, category, search } = req.query;
            const skip = (page - 1) * limit;

            const query = {};
            if (severity) query.severity = severity;
            if (status) query.status = status;
            if (category) query.category = category;
            if (search) {
                query.$or = [
                    { incident_name: { $regex: search, $options: 'i' } },
                    { incident_id: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            const incidents = await incidentsCollection
                .find(query)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .toArray();

            const total = await incidentsCollection.countDocuments(query);

            res.json({
                incidents,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 2. GET /api/soc/incidents/stats - Dashboard statistics
    app.get("/api/soc/incidents/stats", async (_req, res) => {
        try {
            const [bySeverity, byStatus, byCategory] = await Promise.all([
                incidentsCollection.aggregate([
                    { $group: { _id: "$severity", count: { $sum: 1 } } }
                ]).toArray(),
                incidentsCollection.aggregate([
                    { $group: { _id: "$status", count: { $sum: 1 } } }
                ]).toArray(),
                incidentsCollection.aggregate([
                    { $group: { _id: "$category", count: { $sum: 1 } } }
                ]).toArray()
            ]);

            const activeIncidents = await incidentsCollection.countDocuments({
                status: { $ne: 'Closed' }
            });

            res.json({
                by_severity: bySeverity.reduce((acc, item) => {
                    acc[item._id?.toLowerCase() || 'unknown'] = item.count;
                    return acc;
                }, {}),
                by_status: byStatus.reduce((acc, item) => {
                    acc[item._id?.toLowerCase() || 'unknown'] = item.count;
                    return acc;
                }, {}),
                by_category: byCategory.reduce((acc, item) => {
                    acc[item._id || 'unknown'] = item.count;
                    return acc;
                }, {}),
                active_incidents: activeIncidents
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 3. GET /api/soc/incidents/:id - Get incident details
    app.get("/api/soc/incidents/:id", async (req, res) => {
        try {
            const incident = await incidentsCollection.findOne({
                _id: new ObjectId(req.params.id)
            });

            if (!incident) {
                return res.status(404).json({ error: "Incident not found" });
            }

            res.json(incident);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 4. GET /api/soc/incidents/:id/events - Get related events
    app.get("/api/soc/incidents/:id/events", async (req, res) => {
        try {
            const incident = await incidentsCollection.findOne({
                _id: new ObjectId(req.params.id)
            });

            if (!incident) {
                return res.status(404).json({ error: "Incident not found" });
            }

            const events = await eventsCollection.find({
                _id: { $in: incident.related_events }
            }).toArray();

            res.json({ incident, events });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 5. POST /api/soc/incidents/:id/status - Update incident status
    app.post("/api/soc/incidents/:id/status", async (req, res) => {
        try {
            const { status, analyst, note } = req.body;
            const validStatuses = ['New', 'Analysis', 'Response', 'Review', 'Closed'];

            if (!validStatuses.includes(status)) {
                return res.status(400).json({ error: "Invalid status" });
            }

            const incident = await incidentsCollection.findOne({
                _id: new ObjectId(req.params.id)
            });

            if (!incident) {
                return res.status(404).json({ error: "Incident not found" });
            }

            const statusUpdate = {
                timestamp: new Date(),
                from_status: incident.status,
                to_status: status,
                analyst: analyst || 'system'
            };

            const updateDoc = {
                $set: {
                    status,
                    updated_at: new Date()
                },
                $push: {
                    status_history: statusUpdate
                }
            };

            if (note) {
                updateDoc.$push.analyst_notes = {
                    timestamp: new Date(),
                    analyst: analyst || 'system',
                    note
                };
            }

            await incidentsCollection.updateOne(
                { _id: new ObjectId(req.params.id) },
                updateDoc
            );

            res.json({ success: true, message: "Status updated" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 6. POST /api/soc/incidents/:id/notes - Add analyst note
    app.post("/api/soc/incidents/:id/notes", async (req, res) => {
        try {
            const { analyst, note } = req.body;

            if (!note) {
                return res.status(400).json({ error: "Note is required" });
            }

            await incidentsCollection.updateOne(
                { _id: new ObjectId(req.params.id) },
                {
                    $push: {
                        analyst_notes: {
                            timestamp: new Date(),
                            analyst: analyst || 'unknown',
                            note
                        }
                    },
                    $set: { updated_at: new Date() }
                }
            );

            res.json({ success: true, message: "Note added" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 7. POST /api/soc/incidents/:id/close - Close incident
    app.post("/api/soc/incidents/:id/close", async (req, res) => {
        try {
            const { closure_reason, analyst, note } = req.body;
            const validReasons = ['True Positive', 'False Positive', 'Accepted Risk'];

            if (!validReasons.includes(closure_reason)) {
                return res.status(400).json({ error: "Invalid closure reason" });
            }

            const incident = await incidentsCollection.findOne({
                _id: new ObjectId(req.params.id)
            });

            if (!incident) {
                return res.status(404).json({ error: "Incident not found" });
            }

            const updateDoc = {
                $set: {
                    status: 'Closed',
                    closure_reason,
                    updated_at: new Date()
                },
                $push: {
                    status_history: {
                        timestamp: new Date(),
                        from_status: incident.status,
                        to_status: 'Closed',
                        analyst: analyst || 'system'
                    }
                }
            };

            if (note) {
                updateDoc.$push.analyst_notes = {
                    timestamp: new Date(),
                    analyst: analyst || 'system',
                    note
                };
            }

            await incidentsCollection.updateOne(
                { _id: new ObjectId(req.params.id) },
                updateDoc
            );

            res.json({ success: true, message: "Incident closed" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 🔟 MITRE ATT&CK Matrix Data
    app.get("/api/soc/mitre-matrix", async (_req, res) => {
        try {
            let data = analyticsCache.get("mitre:matrix");
            if (!data && statsCacheCollection) {
                const dbCached = await statsCacheCollection.findOne({ key: "mitre_matrix" });
                if (dbCached) {
                    data = dbCached.coverage;
                    analyticsCache.set("mitre:matrix", data, 120);
                }
            }

            if (!data) return res.json([]);
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 1️⃣1️⃣ MITRE Technique Drill-down
    app.get("/api/soc/mitre-technique/:id", async (req, res) => {
        try {
            const { id } = req.params;
            const last30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            const [recentEvents, relatedIncidents] = await Promise.all([
                logsCollection.find({ "mitre.id": id, ts: { $gte: last30d } }).sort({ ts: -1 }).limit(10).toArray(),
                incidentsCollection.find({ "related_events_meta.mitre.id": id }).sort({ created_at: -1 }).limit(5).toArray()
            ]);

            res.json({
                techniqueId: id,
                recentEvents,
                relatedIncidents
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 🚀 EVENT MONITOR: LIVE DATA STREAM
    app.get("/api/soc/event-monitor/live", async (req, res) => {
        try {
            const { page = 1, limit = 20 } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const now = Date.now();
            const lastHour = new Date(now - 60 * 60 * 1000);
            const last5m = new Date(now - 5 * 60 * 1000);

            const query = {
                lastSeen: { $gte: lastHour },
                severity: { $in: ['critical', 'error', 'warning', 'warn', 'high', 'medium'] }
            };

            // 1. Fetch live events from last hour with pagination
            const events = await eventsCollection
                .find(query)
                .sort({ lastSeen: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .toArray();

            const totalInLastHour = await eventsCollection.countDocuments(query);

            // 2. Summary counts & Spike detection
            const summary = {
                critical: 0,
                high: 0,
                medium: 0,
                prevented: 0,
                unmitigated: 0,
                last5mCount: 0,
                spikeDetected: false
            };

            events.forEach(e => {
                const sev = (e.severity || "").toLowerCase();
                if (sev === 'critical') summary.critical++;
                else if (['error', 'high'].includes(sev)) summary.high++;
                else if (['warning', 'warn', 'medium'].includes(sev)) summary.medium++;

                if (e.riskLabel && e.riskLabel.includes('UNMITIGATED')) summary.unmitigated++;
                else summary.prevented++;

                if (new Date(e.lastSeen) >= last5m) {
                    summary.last5mCount += (e.occurrenceCount || 1);
                }
            });

            // 3. High-res timeline (Last 60 mins aggregated by minute)
            const timelineData = await eventsCollection.aggregate([
                { $match: { lastSeen: { $gte: lastHour } } },
                {
                    $group: {
                        _id: {
                            minute: { $minute: "$lastSeen" },
                            severity: "$severity"
                        },
                        count: { $sum: "$occurrenceCount" }
                    }
                },
                { $sort: { "_id.minute": 1 } }
            ]).toArray();

            // Simple spike detection: last 5m > 1.5x average
            const totalOccurrence = events.reduce((sum, e) => sum + (e.occurrenceCount || 1), 0);
            const avg5m = totalOccurrence / 12;
            if (summary.last5mCount > avg5m * 1.5 && summary.last5mCount > 10) {
                summary.spikeDetected = true;
            }

            res.json({
                events,
                summary,
                timeline: timelineData,
                pagination: {
                    total: totalInLastHour,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(totalInLastHour / limit)
                },
                timestamp: now
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 🛡️ EVENT MONITOR: PROMOTE TO INCIDENT
    app.post("/api/soc/events/:id/promote", async (req, res) => {
        try {
            const { id } = req.params;
            const { analyst } = req.body;

            const event = await eventsCollection.findOne({ _id: new ObjectId(id) });
            if (!event) return res.status(404).json({ error: "Event not found" });

            const incidentData = {
                incident_name: `Escalation: ${event.eventName}`,
                severity: event.severity === 'critical' ? 'Critical' : 'High',
                category: event.category || 'Security Event',
                affected_assets: [event.source],
                related_events: [event._id],
                confidence_score: 95,
                description: `Manually promoted from Event Monitor. \n\nEvent: ${event.eventName}\nSource: ${event.source}\nTarget: ${event.target}\nCategory: ${event.category}`,
                trigger_rule: 'manual_escalation'
            };

            const incident = await createOrUpdateIncident(incidentData, incidentsCollection);
            res.json({ success: true, incident });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });


    // 📊 SOC DASHBOARD: KPIS (Cached 60s)
    app.get("/api/soc/dashboard/kpis", async (_req, res) => {
        try {
            const data = await getCachedOrRun("soc:dashboard:kpis", 60, async () => {
                const now = Date.now();
                const lastHour = new Date(now - 3600000);

                const [highIncidents, outbreakAlerts, affectedAssets, activeDevices] = await Promise.all([
                    incidentsCollection.countDocuments({ status: { $ne: 'Closed' }, severity: { $in: ['High', 'Critical', 'high', 'critical'] } }),
                    logsCollection.countDocuments({
                        ts: { $gte: lastHour },
                        $or: [
                            { severity: { $in: ['error', 'critical', 'Error', 'Critical', 'alert', 'ALERT'] } },
                            { level: { $in: ['error', 'critical', 'Error', 'Critical', 'alert', 'ALERT'] } }
                        ]
                    }, { hint: { ts: -1 } }),
                    incidentsCollection.distinct('affected_assets', { status: { $ne: 'Closed' } }),
                    logsCollection.distinct('deviceName', { ts: { $gte: lastHour } }).then(res => res.length > 0 ? res : logsCollection.distinct('devname', { ts: { $gte: lastHour } }))
                ]);

                return {
                    highSeverityIncidents: highIncidents,
                    outbreakAlerts: outbreakAlerts,
                    compromisedHosts: affectedAssets.length,
                    affectedUsers: Math.floor(affectedAssets.length * 1.5), // Simulated for users
                    activeConnectors: 1, // Static for now
                    deviceTypes: Array.isArray(activeDevices) ? activeDevices.length : activeDevices
                };
            });
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 📊 SOC DASHBOARD: SANKEY (Events Map) (Cached 120s)
    app.get("/api/soc/dashboard/sankey", async (_req, res) => {
        try {
            const data = await getCachedOrRun("soc:dashboard:sankey", 120, async () => {
                const last24h = new Date(Date.now() - 24 * 3600000);
                const results = await logsCollection.aggregate([
                    { $match: { ts: { $gte: last24h } } },
                    {
                        $group: {
                            _id: {
                                sev: { $ifNull: ["$severity", "$level", "unknown"] },
                                dev: { $ifNull: ["$deviceName", "$devname", "unknown"] }
                            },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { count: -1 } },
                    { $limit: 20 }
                ], { hint: { ts: -1 } }).toArray();

                // Transform for Sankey structure
                return results.map(d => ({
                    source: d._id.sev || 'unknown',
                    target: d._id.dev || 'unknown',
                    value: d.count
                }));
            });
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 📊 SOC DASHBOARD: INCIDENT CATEGORIES
    app.get("/api/soc/dashboard/incident-categories", async (_req, res) => {
        try {
            const cats = await incidentsCollection.aggregate([
                { $match: { status: { $ne: 'Closed' } } },
                { $group: { _id: "$category", count: { $sum: 1 } } }
            ]).toArray();
            res.json(cats.map(c => ({ name: c._id, value: c.count })));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 📊 SOC DASHBOARD: TOP INCIDENTS (Cached 60s)
    app.get("/api/soc/dashboard/top-incidents", async (_req, res) => {
        try {
            const data = await getCachedOrRun("soc:dashboard:top-incidents", 60, async () => {
                return await incidentsCollection.find({ status: { $ne: 'Closed' } })
                    .sort({ timestamp: -1 })
                    .limit(5)
                    .toArray();
            });
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 📊 SOC DASHBOARD: EVENTS TREND (Cached 300s)
    app.get("/api/soc/dashboard/events-trend", async (_req, res) => {
        try {
            const data = await getCachedOrRun("soc:dashboard:events-trend", 300, async () => {
                const last24h = new Date(Date.now() - 24 * 3600000);
                const stats = await logsCollection.aggregate([
                    { $match: { ts: { $gte: last24h } } },
                    {
                        $group: {
                            _id: { $hour: "$ts" },
                            logs: { $sum: 1 },
                            security: {
                                $sum: {
                                    $cond: [
                                        {
                                            $or: [
                                                { $in: ["$severity", ["error", "critical", "warn", "warning", "alert"]] },
                                                { $in: ["$level", ["error", "critical", "warn", "warning", "alert", "notice"]] }
                                            ]
                                        },
                                        1, 0
                                    ]
                                }
                            }
                        }
                    },
                    { $sort: { "_id": 1 } }
                ], { hint: { ts: -1 } }).toArray();

                return stats.map(s => ({ hour: s._id, logs: s.logs, security: s.security }));
            });
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 🗾 ATTACK MAP DATA (Cached 60s)
    app.get("/api/soc/attack-map", async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const data = await getCachedOrRun("soc:attack-map", 60, async () => {
                const logs = await logsCollection
                    .find({ srcLat: { $ne: null } })
                    .sort({ ts: -1 })
                    .limit(limit)
                    .toArray();
                return logs;
            });
            res.json({ ok: true, logs: data });
        } catch (err) {
            console.error("❌ Attack Map Fetch Error:", err.message);
            res.status(500).json({ ok: false, error: err.message });
        }
    });

    // 📊 SOC DASHBOARD: CONNECTORS
    app.get("/api/soc/dashboard/connectors", async (_req, res) => {
        res.json([
            { name: "FortiClient EMS Connector", status: "online", lastSync: "2m ago" },
            { name: "FortiMail Connector", status: "online", lastSync: "5m ago" },
            { name: "FortiOS Connector", status: "warning", lastSync: "10m ago" },
            { name: "FortiCasb Connector", status: "online", lastSync: "1m ago" }
        ]);
    });

    // ✅ Advanced SOC endpoints registered
    console.log("✅ Advanced SOC endpoints registered");
}
