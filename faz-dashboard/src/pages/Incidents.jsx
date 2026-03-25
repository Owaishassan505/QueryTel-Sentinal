import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    AlertTriangle,
    Shield,
    Clock,
    User,
    FileText,
    X,
    ChevronRight,
    Filter,
    Search,
    RefreshCw,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { backendURL } from '../config';

const Incidents = () => {
    const [incidents, setIncidents] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        severity: '',
        status: '',
        category: '',
        search: ''
    });
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [relatedEvents, setRelatedEvents] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const fetchIncidents = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${backendURL}/api/soc/incidents`, {
                params: {
                    page,
                    limit: 15,
                    ...filters
                }
            });
            setIncidents(res.data.incidents);
            setTotalPages(res.data.pagination.totalPages);
        } catch (err) {
            console.error('Error fetching incidents:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${backendURL}/api/soc/incidents/stats`);
            setStats(res.data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const fetchIncidentDetails = async (id) => {
        setLoadingDetails(true);
        try {
            const [incidentRes, eventsRes] = await Promise.all([
                axios.get(`${backendURL}/api/soc/incidents/${id}`),
                axios.get(`${backendURL}/api/soc/incidents/${id}/events`)
            ]);
            setSelectedIncident(incidentRes.data);
            setRelatedEvents(eventsRes.data.events);
        } catch (err) {
            console.error('Error fetching incident details:', err);
        } finally {
            setLoadingDetails(false);
        }
    };

    const updateStatus = async (status, note = '') => {
        try {
            await axios.post(`${backendURL}/api/soc/incidents/${selectedIncident._id}/status`, {
                status,
                analyst: 'current_user',
                note
            });
            fetchIncidents();
            fetchIncidentDetails(selectedIncident._id);
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const closeIncident = async (closure_reason, note) => {
        try {
            await axios.post(`${backendURL}/api/soc/incidents/${selectedIncident._id}/close`, {
                closure_reason,
                analyst: 'current_user',
                note
            });
            setSelectedIncident(null);
            fetchIncidents();
            fetchStats();
        } catch (err) {
            console.error('Error closing incident:', err);
        }
    };

    useEffect(() => {
        fetchIncidents();
        fetchStats();
    }, [page, filters]);

    const getSeverityColor = (severity) => {
        const colors = {
            'Critical': 'bg-red-500/20 text-red-300 border-red-500/30',
            'High': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
            'Medium': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
            'Low': 'bg-blue-500/20 text-blue-300 border-blue-500/30'
        };
        return colors[severity] || colors['Low'];
    };

    const getStatusColor = (status) => {
        const colors = {
            'New': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            'Analysis': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            'Response': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
            'Review': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
            'Closed': 'bg-green-500/20 text-green-300 border-green-500/30'
        };
        return colors[status] || colors['New'];
    };

    const SEVERITY_COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6'];
    const STATUS_COLORS = ['#a855f7', '#3b82f6', '#f97316', '#eab308', '#22c55e'];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Security Incidents</h1>
                        <p className="text-sm text-slate-400">Case Management & Investigation</p>
                    </div>
                </div>
                <button
                    onClick={() => { fetchIncidents(); fetchStats(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg text-indigo-300 transition-all"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {/* Active Incidents */}
                    <div className="bg-slate-800/40 backdrop-blur-sm border border-white/5 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-slate-400 uppercase tracking-wider">Active Incidents</span>
                            <Shield className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="text-3xl font-bold text-white">{stats.active_incidents || 0}</div>
                    </div>

                    {/* By Severity Chart */}
                    <div className="bg-slate-800/40 backdrop-blur-sm border border-white/5 rounded-xl p-4 col-span-1">
                        <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">By Severity</div>
                        <ResponsiveContainer width="100%" height={100}>
                            <PieChart>
                                <Pie
                                    data={Object.entries(stats.by_severity || {}).map(([key, value]) => ({
                                        name: key,
                                        value
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={25}
                                    outerRadius={40}
                                    dataKey="value"
                                >
                                    {Object.keys(stats.by_severity || {}).map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[index % SEVERITY_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* By Status Chart */}
                    <div className="bg-slate-800/40 backdrop-blur-sm border border-white/5 rounded-xl p-4 col-span-2">
                        <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">By Status</div>
                        <ResponsiveContainer width="100%" height={100}>
                            <BarChart data={Object.entries(stats.by_status || {}).map(([key, value]) => ({
                                name: key,
                                count: value
                            }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                                <YAxis stroke="#94a3b8" style={{ fontSize: '10px' }} />
                                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }} />
                                <Bar dataKey="count" fill="#6366f1" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-slate-800/40 backdrop-blur-sm border border-white/5 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs text-slate-400 mb-2">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search incidents..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500/50"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-2">Severity</label>
                        <select
                            value={filters.severity}
                            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500/50"
                        >
                            <option value="">All</option>
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-2">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500/50"
                        >
                            <option value="">All</option>
                            <option value="New">New</option>
                            <option value="Analysis">Analysis</option>
                            <option value="Response">Response</option>
                            <option value="Review">Review</option>
                            <option value="Closed">Closed</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-2">Category</label>
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500/50"
                        >
                            <option value="">All</option>
                            <option value="Malware">Malware</option>
                            <option value="Unauthorized Access">Unauthorized Access</option>
                            <option value="C2">C2</option>
                            <option value="Suspicious Activity">Suspicious Activity</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Incidents Table */}
            <div className="bg-slate-800/40 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-900/50 border-b border-white/5">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Severity</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Incident ID</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Incident Name</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Affected Assets</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">First Detected</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading incidents...
                                    </td>
                                </tr>
                            ) : incidents.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                                        No incidents found
                                    </td>
                                </tr>
                            ) : (
                                incidents.map((incident) => (
                                    <tr key={incident._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold border ${getSeverityColor(incident.severity)}`}>
                                                {incident.severity}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-mono text-indigo-300">{incident.incident_id}</td>
                                        <td className="px-4 py-3 text-sm text-white font-medium">{incident.incident_name}</td>
                                        <td className="px-4 py-3 text-sm text-slate-300">
                                            {incident.affected_assets.slice(0, 2).join(', ')}
                                            {incident.affected_assets.length > 2 && ` +${incident.affected_assets.length - 2}`}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold border ${getStatusColor(incident.status)}`}>
                                                {incident.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-400">
                                            {new Date(incident.first_detected).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => fetchIncidentDetails(incident._id)}
                                                className="flex items-center gap-1 px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg text-indigo-300 text-xs transition-all"
                                            >
                                                View Details
                                                <ChevronRight className="w-3 h-3" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-900/50 border-t border-white/5">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 rounded-lg text-white text-sm transition-all"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-slate-400">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 rounded-lg text-white text-sm transition-all"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Incident Detail Modal */}
            {selectedIncident && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-6 flex items-center justify-between z-10">
                            <div>
                                <h2 className="text-xl font-bold text-white">{selectedIncident.incident_id}</h2>
                                <p className="text-sm text-slate-400">{selectedIncident.incident_name}</p>
                            </div>
                            <button
                                onClick={() => setSelectedIncident(null)}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Status & Severity */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-2">Severity</label>
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-semibold border ${getSeverityColor(selectedIncident.severity)}`}>
                                        {selectedIncident.severity}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-2">Current Status</label>
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-semibold border ${getStatusColor(selectedIncident.status)}`}>
                                        {selectedIncident.status}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-2">Description</label>
                                <p className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded-lg border border-white/5">
                                    {selectedIncident.description}
                                </p>
                            </div>

                            {/* Affected Assets */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-2">Affected Assets</label>
                                <div className="flex flex-wrap gap-2">
                                    {selectedIncident.affected_assets.map((asset, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-xs font-mono">
                                            {asset}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Related Events */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-2">Related Events ({relatedEvents.length})</label>
                                <div className="bg-slate-800/50 border border-white/5 rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-slate-900/50 border-b border-white/5">
                                                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400">Event Name</th>
                                                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400">Category</th>
                                                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400">Occurrences</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {relatedEvents.map((event) => (
                                                <tr key={event._id} className="border-b border-white/5">
                                                    <td className="px-3 py-2 text-xs text-slate-300">{event.eventName}</td>
                                                    <td className="px-3 py-2 text-xs text-slate-400">{event.category}</td>
                                                    <td className="px-3 py-2 text-xs text-slate-400">{event.occurrenceCount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Status Management */}
                            {selectedIncident.status !== 'Closed' && (
                                <div>
                                    <label className="block text-xs text-slate-400 mb-2">Update Status</label>
                                    <div className="flex gap-2">
                                        {['Analysis', 'Response', 'Review'].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => updateStatus(status)}
                                                className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg text-indigo-300 text-sm transition-all"
                                            >
                                                Move to {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Close Incident */}
                            {selectedIncident.status !== 'Closed' && (
                                <div>
                                    <label className="block text-xs text-slate-400 mb-2">Close Incident</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => closeIncident('True Positive', 'Incident remediated successfully')}
                                            className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg text-green-300 text-sm transition-all"
                                        >
                                            <CheckCircle className="w-4 h-4 inline mr-1" />
                                            True Positive
                                        </button>
                                        <button
                                            onClick={() => closeIncident('False Positive', 'Incident was a false alarm')}
                                            className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg text-yellow-300 text-sm transition-all"
                                        >
                                            <AlertCircle className="w-4 h-4 inline mr-1" />
                                            False Positive
                                        </button>
                                        <button
                                            onClick={() => closeIncident('Accepted Risk', 'Risk accepted by management')}
                                            className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-lg text-orange-300 text-sm transition-all"
                                        >
                                            <XCircle className="w-4 h-4 inline mr-1" />
                                            Accepted Risk
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Incidents;
