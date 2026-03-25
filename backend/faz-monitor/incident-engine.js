/**
 * Incident Detection Engine
 * Auto-creates security incidents based on event correlation patterns
 */

/**
 * Incident Generation Rules
 * Returns { shouldCreate, incidentData } or { shouldCreate: false }
 */
export async function detectIncident(event, eventsCollection, incidentsCollection) {
    // Rule 1: Unmitigated Threat
    if (event.riskLabel && event.riskLabel.includes('UNMITIGATED THREAT')) {
        // Check if incident already exists for this pattern
        const existingIncident = await incidentsCollection.findOne({
            affected_assets: event.source,
            status: { $ne: 'Closed' },
            trigger_rule: 'unmitigated_threat'
        });

        if (!existingIncident) {
            return {
                shouldCreate: true,
                incidentData: {
                    incident_name: `Unmitigated ${event.category} on ${event.source}`,
                    severity: 'Critical',
                    category: event.category || 'Unknown',
                    affected_assets: [event.source],
                    related_events: [event._id],
                    confidence_score: 90,
                    description: `Critical unmitigated threat detected. ${event.eventName || 'Security event'} was not blocked by security controls.`,
                    trigger_rule: 'unmitigated_threat'
                }
            };
        }
    }

    // Rule 2: Multiple High-Risk Events from Same Source
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const relatedHighRiskEvents = await eventsCollection.find({
        source: event.source,
        riskLevel: { $in: ['HIGH', 'CRITICAL'] },
        lastSeen: { $gte: oneHourAgo }
    }).limit(50).toArray();

    if (relatedHighRiskEvents.length >= 3) {
        // Check if incident already exists for this pattern
        const existingIncident = await incidentsCollection.findOne({
            affected_assets: event.source,
            status: { $ne: 'Closed' },
            trigger_rule: 'multiple_high_risk'
        });

        if (!existingIncident) {
            return {
                shouldCreate: true,
                incidentData: {
                    incident_name: `Multiple High-Risk Events from ${event.source}`,
                    severity: 'High',
                    category: 'Suspicious Activity',
                    affected_assets: [event.source],
                    related_events: relatedHighRiskEvents.map(e => e._id),
                    confidence_score: 75,
                    description: `${relatedHighRiskEvents.length} high-risk security events detected from the same source within 1 hour.`,
                    trigger_rule: 'multiple_high_risk'
                }
            };
        }
    }

    // Rule 3: C2 Communication Pattern
    if (['IPS', 'MALWARE', 'ANTIVIRUS'].includes(event.category?.toUpperCase())) {
        const c2Events = await eventsCollection.find({
            source: event.source,
            target: event.target,
            category: { $in: ['IPS', 'MALWARE', 'ANTIVIRUS'] },
            lastSeen: { $gte: oneHourAgo }
        }).limit(50).toArray();

        if (c2Events.length >= 2) {
            const existingC2Incident = await incidentsCollection.findOne({
                affected_assets: event.source,
                status: { $ne: 'Closed' },
                trigger_rule: 'c2_pattern'
            });

            if (!existingC2Incident) {
                return {
                    shouldCreate: true,
                    incidentData: {
                        incident_name: `Potential C2 Communication from ${event.source}`,
                        severity: 'Critical',
                        category: 'C2',
                        affected_assets: [event.source],
                        related_events: c2Events.map(e => e._id),
                        confidence_score: 85,
                        description: `Repeated malware/IPS events detected, indicating potential Command & Control communication to ${event.target}.`,
                        trigger_rule: 'c2_pattern'
                    }
                };
            }
        }
    }

    // Rule 4: Brute-Force Success Pattern
    if (event.category?.toUpperCase() === 'FAILED LOGIN') {
        const failedLogins = await eventsCollection.find({
            source: event.source,
            category: 'Failed Login',
            lastSeen: { $gte: oneHourAgo }
        }).limit(50).toArray();

        if (failedLogins.length >= 5) {
            // Check for subsequent successful login
            const successfulLogin = await eventsCollection.findOne({
                source: event.source,
                category: { $in: ['VPN', 'Admin Access', 'Authentication'] },
                lastSeen: { $gte: oneHourAgo }
            });

            if (successfulLogin) {
                const existingBruteForce = await incidentsCollection.findOne({
                    affected_assets: event.source,
                    status: { $ne: 'Closed' },
                    trigger_rule: 'brute_force_success'
                });

                if (!existingBruteForce) {
                    return {
                        shouldCreate: true,
                        incidentData: {
                            incident_name: `Brute-Force Attack Success from ${event.source}`,
                            severity: 'Critical',
                            category: 'Unauthorized Access',
                            affected_assets: [event.source],
                            related_events: [...failedLogins.map(e => e._id), successfulLogin._id],
                            confidence_score: 80,
                            description: `${failedLogins.length} failed login attempts followed by successful authentication detected.`,
                            trigger_rule: 'brute_force_success'
                        }
                    };
                }
            }
        }
    }

    return { shouldCreate: false };
}

/**
 * Create or update an incident
 */
export async function createOrUpdateIncident(incidentData, incidentsCollection) {
    const now = new Date();
    const year = now.getFullYear();

    // Generate cluster-safe incident ID
    // Format: INC-[YEAR]-[MMDD]-[MS][RANDOM]
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    const random = Math.floor(Math.random() * 1000);
    const incident_id = `INC-${year}${mm}${dd}-${ms}${random}`;

    const incident = {
        incident_id,
        incident_name: incidentData.incident_name,
        severity: incidentData.severity,
        category: incidentData.category,
        affected_assets: incidentData.affected_assets,
        related_events: incidentData.related_events,
        first_detected: now,
        last_activity: now,
        status: 'New',
        assigned_analyst: 'unassigned',
        confidence_score: incidentData.confidence_score,
        description: incidentData.description,
        trigger_rule: incidentData.trigger_rule,
        closure_reason: null,
        analyst_notes: [],
        status_history: [{
            timestamp: now,
            from_status: null,
            to_status: 'New',
            analyst: 'system'
        }],
        created_at: now,
        updated_at: now
    };

    try {
        await incidentsCollection.insertOne(incident);
        console.log(`✅ Incident created: ${incident_id} - ${incident.incident_name}`);
        return incident;
    } catch (err) {
        if (err.code === 11000) {
            // Collision still possible but extremely rare now. Fallback to retry with more entropy.
            const uniqueId = `${incident_id}-${Math.floor(Math.random() * 100000)}`;
            incident.incident_id = uniqueId;
            await incidentsCollection.insertOne(incident);
            return incident;
        }
        throw err;
    }

    console.error("❌ Failed to create incident after retries due to ID collisions");
    return null;
}

/**
 * Update incident with new related event
 */
export async function updateIncidentWithEvent(incidentId, eventId, incidentsCollection) {
    await incidentsCollection.updateOne(
        { _id: incidentId },
        {
            $addToSet: { related_events: eventId },
            $set: { last_activity: new Date(), updated_at: new Date() }
        }
    );
}
