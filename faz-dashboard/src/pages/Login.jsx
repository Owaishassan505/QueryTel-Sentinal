import React, { useState } from "react";
import { apiFetch } from "../api/api";
import { backendURL } from "../config";
import { ShieldAlert, ArrowRight, Lock, Mail, Server, RefreshCw } from "lucide-react";

export default function Login() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const email = e.target.email.value.trim();
            const password = e.target.password.value.trim();

            const res = await apiFetch("/api/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                setError(res.data?.message || "Invalid credentials provided");
                setLoading(false);
                return;
            }

            if (res.data.require2FA) {
                localStorage.setItem("pending_2fa_email", email);
                window.location.href = "/2fa";
                return;
            }

            if (res.data.require2FASetup) {
                localStorage.setItem("pending_2fa_email", email);
                window.location.href = "/2fa-setup";
                return;
            }

            localStorage.setItem("token", res.data.token);
            window.location.href = "/";
        } catch (err) {
            setError("Connectivity error - check network status");
        } finally {
            setLoading(false);
        }
    }

    const azureLogin = () => {
        window.location.href = `${backendURL}/auth/azure/login`;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0c10] px-4 selection:bg-blue-500/30">
            <div className="w-full max-w-[420px]">
                {/* Branding */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2.5rem] bg-[#0f172a] shadow-2xl mb-6 p-4 border-4 border-slate-800/50">
                        <ShieldAlert className="w-full h-full text-blue-500 animate-pulse" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter italic italic flex items-center justify-center gap-2">
                        QUERYTEL <span className="text-blue-500">SENTINEL</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-3">Enterprise Security Operations</p>
                </div>

                <div className="bg-[#0f172a]/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-slate-800">
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">System Authentication</h2>
                        </div>
                        <p className="text-lg font-black text-white uppercase tracking-widest leading-none mt-4">SECURE COMMAND ACCESS</p>
                    </div>

                    {error && (
                        <div className="mb-8 bg-rose-500/10 text-rose-400 px-5 py-3.5 rounded-2xl text-[11px] font-bold border border-rose-500/20 flex items-center gap-3">
                            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="relative group">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="email"
                                name="email"
                                placeholder="Ops-ID / Email"
                                className="w-full pl-14 pr-4 py-4 bg-black/40 border border-slate-800 rounded-2xl text-slate-100 placeholder:text-slate-700 focus:border-blue-500/50 outline-none transition-all text-sm font-semibold shadow-inner"
                                required
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="password"
                                name="password"
                                placeholder="Access Key"
                                className="w-full pl-14 pr-4 py-4 bg-black/40 border border-slate-800 rounded-2xl text-slate-100 placeholder:text-slate-700 focus:border-blue-500/50 outline-none transition-all text-sm font-semibold shadow-inner"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-4 bg-blue-600 hover:bg-blue-500 text-white py-4.5 rounded-2xl shadow-[0_10px_30px_rgba(37,99,235,0.2)] transition-all active:scale-95 disabled:opacity-50 group mt-6 font-black text-xs uppercase tracking-[0.2em]"
                        >
                            {loading ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Establish Session</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="relative my-10 text-center">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800/50"></div></div>
                        <span className="relative bg-[#1a2333] px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">Federated Gateway</span>
                    </div>

                    <button
                        onClick={azureLogin}
                        className="w-full flex justify-center items-center gap-4 bg-slate-900/50 hover:bg-slate-800 text-slate-300 py-4 rounded-2xl border border-slate-800 transition-all font-bold text-xs uppercase tracking-widest"
                    >
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                            className="w-4 h-4"
                            alt="Microsoft"
                        />
                        Secure Login (SSO)
                    </button>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em]">QueryTel Encrypted Perimeter V4.0.2</p>
                </div>
            </div>
        </div>
    );
}
