import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Ticket,
    Search,
    Plus,
    RefreshCw,
    Filter,
    ChevronRight,
    ChevronLeft,
    Clock,
    User,
    AlertCircle,
    CheckCircle2,
    Clock3,
    MoreVertical,
    Send,
    X,
    ShieldAlert
} from 'lucide-react';
import { backendURL } from '../config';

const Tickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalTickets, setTotalTickets] = useState(0);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        userName: '',
        userEmail: '',
        issueDescription: ''
    });

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${backendURL}/api/zoho/tickets`, {
                params: {
                    limit: 15,
                    from: (page - 1) * 15,
                    status: statusFilter !== 'all' ? statusFilter : undefined
                }
            });
            setTickets(res.data.tickets || []);
            setTotalTickets(res.data.count || 0);
        } catch (err) {
            console.error("Failed to fetch tickets:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [page, statusFilter]);

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await axios.post(`${backendURL}/api/zoho/tickets`, formData);
            if (res.data.ok) {
                setIsModalOpen(false);
                setFormData({ userName: '', userEmail: '', issueDescription: '' });
                fetchTickets();
            } else {
                alert("Failed to create ticket: " + res.data.result);
            }
        } catch (err) {
            console.error("Ticket creation failed:", err);
            alert("Error creating ticket. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusIcon = (status) => {
        const s = status.toLowerCase();
        if (s.includes('open')) return <Clock3 className="w-3.5 h-3.5 text-blue-400" />;
        if (s.includes('closed') || s.includes('resolved')) return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
        return <AlertCircle className="w-3.5 h-3.5 text-amber-400" />;
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-blue-500/30">
            <div className="px-6 pb-6 pt-0 space-y-6">

                {/* HEADER */}
                <div className="bg-gradient-to-r from-slate-900/60 via-blue-900/20 to-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[2rem] py-4 px-6 flex items-center justify-between shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
                            <Ticket className="w-6 h-6 text-blue-500 animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic leading-none">
                                TICKET <span className="text-blue-500">MANAGEMENT</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                    <ShieldAlert className="w-2.5 h-2.5" /> ZOHO DESK INTEGRATED
                                </span>
                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">•</span>
                                <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest font-mono">SUPPORT CORE ONLINE</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 text-white rounded-2xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:bg-blue-500 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            New Ticket
                        </button>
                        <button
                            onClick={fetchTickets}
                            className="p-2.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
                        >
                            <RefreshCw className={`w-4 h-4 text-slate-400 group-hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* FILTERS & SEARCH */}
                <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 shadow-2xl">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="flex items-center bg-black/40 border border-white/10 rounded-2xl px-4 py-2">
                                <Filter className="w-3.5 h-3.5 text-blue-500 mr-3" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-transparent border-none outline-none text-[10px] font-black text-slate-300 uppercase tracking-widest focus:ring-0 cursor-pointer"
                                >
                                    <option value="all">All States</option>
                                    <option value="Open">Open</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="On Hold">On Hold</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center bg-black/60 border border-white/10 rounded-2xl px-5 py-3 focus-within:border-blue-500/50 transition-all w-full md:w-96 group shadow-inner text-white font-bold">
                            <Search className="w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by Ticket ID or Subject..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-[11px] font-bold text-slate-200 ml-4 w-full placeholder:text-slate-600 focus:ring-0"
                            />
                        </div>
                    </div>

                    {/* TICKETS TABLE */}
                    <div className="mt-8 overflow-x-auto custom-scrollbar min-h-[400px]">
                        <table className="w-full text-left border-separate border-spacing-y-2">
                            <thead>
                                <tr className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    <th className="px-6 pb-2 italic">Status</th>
                                    <th className="px-6 pb-2 italic">Ticket ID</th>
                                    <th className="px-6 pb-2 italic">Subject</th>
                                    <th className="px-6 pb-2 italic">Requester</th>
                                    <th className="px-6 pb-2 italic text-center">Priority</th>
                                    <th className="px-6 pb-2 italic text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-0 text-white font-bold">
                                {loading && tickets.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-20 text-center">
                                            <div className="flex flex-col items-center">
                                                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                                                <span className="font-black text-xs uppercase tracking-widest text-slate-600">Retrieving Ticket Manifest...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : tickets.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-20 text-center text-slate-600 font-black uppercase tracking-[0.4em] italic opacity-40">
                                            No Tickets Found in System
                                        </td>
                                    </tr>
                                ) : (
                                    tickets.map((ticket) => (
                                        <tr key={ticket.id} className="group bg-white/[0.02] hover:bg-white/[0.05] transition-all transform hover:translate-x-1">
                                            <td className="py-5 px-6 first:rounded-l-2xl border-l border-t border-b border-white/5">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(ticket.status || '')}
                                                    <span className="text-[10px] uppercase font-black tracking-widest">{ticket.status}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 border-t border-b border-white/5 font-mono text-[10px] text-blue-400">
                                                #{ticket.ticketNumber}
                                            </td>
                                            <td className="py-5 px-6 border-t border-b border-white/5">
                                                <div>
                                                    <p className="text-xs font-black text-white italic line-clamp-1">{ticket.subject}</p>
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                        {new Date(ticket.createdTime).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 border-t border-b border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-3.5 h-3.5 text-slate-500" />
                                                    <span className="text-[10px]">{ticket.contact?.email || 'Unknown Client'}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 text-center border-t border-b border-white/5">
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${ticket.priority === 'High' ? 'bg-red-500/20 text-red-500' :
                                                        ticket.priority === 'Medium' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-slate-400'
                                                    }`}>
                                                    {ticket.priority || 'Normal'}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6 last:rounded-r-2xl text-right border-r border-t border-b border-white/5">
                                                <button className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}
                    <div className="mt-8 flex items-center justify-between pt-6 border-t border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            Records: <span className="text-white">{tickets.length}</span> Active
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 disabled:opacity-20 transition-all flex items-center gap-2"
                            >
                                <ChevronLeft className="w-3 h-3" /> Prev
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={tickets.length < 15}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 disabled:opacity-20 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                                Next <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* CREATE MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/90 backdrop-blur-sm">
                    <div className="bg-[#0f172a] border border-white/10 rounded-[2.5rem] w-full max-w-lg flex flex-col shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-900/40 to-slate-900">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                                    <Plus className="w-5 h-5 text-blue-500" />
                                </div>
                                <h3 className="text-lg font-black text-white italic tracking-tighter uppercase">Generate Manual Ticket</h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTicket} className="p-8 space-y-5">
                            <div className="space-y-2 text-white font-bold">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reporter Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.userName}
                                    onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                                    placeholder="SOC Analyst Name"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500/50 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2 text-white font-bold">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    value={formData.userEmail}
                                    onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                                    placeholder="analyst@querytel.com"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500/50 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2 text-white font-bold">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Incident Description</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.issueDescription}
                                    onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                                    placeholder="Describe the security incident or support request..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500/50 outline-none transition-all resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
                            >
                                {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                {isSubmitting ? 'PROCESSING...' : 'DISPATCH TICKET'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 20px; }
                .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
            ` }} />
        </div>
    );
};

export default Tickets;
