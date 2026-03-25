import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Send, Bot, User as UserIcon, Loader2,
    MessageSquare, ShieldCheck, Zap, Maximize2, Minimize2,
    RotateCcw, Trash2
} from 'lucide-react';
import axios from 'axios';
import { backendURL } from '../../config';

export default function CopilotPanel({ isOpen, onClose }) {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Hello Analyst! I am your QueryTel Copilot. How can I assist you with threat intelligence or log analysis today?"
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Using the /chat endpoint in our ai-summary service
            // Note: Since we use proxy or exact URLs, we need to ensure the correct path
            const response = await axios.post(`${backendURL}/api/analysis/chat`, {
                message: input,
                history: messages.slice(-10) // Send last 10 messages for context
            });

            const aiResponse = response.data.response;
            setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
        } catch (error) {
            console.error("Copilot Error:", error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "⚠️ I encountered an error communicating with the Neural Core. Please ensure the AI service is operational."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearHistory = () => {
        setMessages([{
            role: 'assistant',
            content: "Neural core reset. Session history purged. How can I help you now?"
        }]);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`fixed right-0 top-0 h-screen bg-[#020617]/95 backdrop-blur-3xl border-l border-white/5 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-[60] flex flex-col transition-all duration-300 ${isMinimized ? 'w-20' : 'w-[450px]'}`}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-blue-600/5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                            <Bot className="w-6 h-6 text-blue-400" />
                        </div>
                        {!isMinimized && (
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-tighter italic">QueryTel Copilot</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Neural Link Active</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={clearHistory}
                            className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                            title="Clear History"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-500 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {!isMinimized ? (
                    <>
                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10"
                        >
                            {messages.map((msg, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={i}
                                    className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0 ${msg.role === 'user'
                                            ? 'bg-slate-800 border-white/10'
                                            : 'bg-blue-600/10 border-blue-500/20'
                                        }`}>
                                        {msg.role === 'user' ? <UserIcon className="w-4 h-4 text-slate-400" /> : <ShieldCheck className="w-4 h-4 text-blue-400" />}
                                    </div>
                                    <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                                        <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${msg.role === 'user'
                                                ? 'bg-blue-600 text-white rounded-tr-none shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                                                : 'bg-white/5 text-slate-200 border border-white/5 rounded-tl-none'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                                        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                                    </div>
                                    <div className="bg-white/5 px-4 py-3 rounded-2xl border border-white/5 rounded-tl-none">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-blue-500/40 rounded-full animate-bounce"></span>
                                            <span className="w-1.5 h-1.5 bg-blue-500/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                            <span className="w-1.5 h-1.5 bg-blue-500/40 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-6 border-t border-white/5 bg-slate-900/50">
                            <form onSubmit={handleSendMessage} className="relative group">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask anything about security..."
                                    className="w-full bg-[#020617] border border-white/10 rounded-2xl pl-12 pr-14 py-4 text-sm font-medium text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-all shadow-inner"
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <MessageSquare className="w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl flex items-center justify-center transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                            <div className="mt-4 flex items-center justify-center gap-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">
                                <span className="flex items-center gap-1"><Zap className="w-2.5 h-2.5" /> Llama 3.2 Engine</span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><ShieldCheck className="w-2.5 h-2.5" /> Encrypted Session</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-6 overflow-hidden">
                        <button
                            onClick={() => setIsMinimized(false)}
                            className="w-10 h-10 bg-blue-600/10 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-lg"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
