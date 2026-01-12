import React, { useState } from "react";
import { apiFetch } from "../api/api";
import { backendURL } from "../config";
import {
    LockClosedIcon,
    ArrowRightIcon,
} from "@heroicons/react/24/solid";

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
                setError(res.data?.message || "Invalid email or password");
                setLoading(false);
                return;
            }

            // 🚀 User has 2FA enabled → go to verification page
            if (res.data.require2FA) {
                localStorage.setItem("pending_2fa_email", email);
                window.location.href = "/2fa";
                return;
            }

            // 🚀 User must set up 2FA → go to QR setup
            if (res.data.require2FASetup) {
                localStorage.setItem("pending_2fa_email", email);
                window.location.href = "/2fa-setup";
                return;
            }

            // 🚀 Normal login success
            localStorage.setItem("token", res.data.token);
            window.location.href = "/";
        } catch (err) {
            console.error("Login Error:", err);
            setError("Unable to connect to server");
        } finally {
            setLoading(false);
        }
    }

    function azureLogin() {
        window.location.href = `${backendURL}/auth/azure/login`;

    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
            <div className="w-full max-w-md bg-gray-900/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-gray-700">

                {/* Logo */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-primary">
                        QueryTel Sentinel
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Secure Login</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 bg-red-500/20 text-red-300 px-3 py-2 rounded-md text-sm">
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="text-gray-300 text-sm">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="w-full px-4 py-2 mt-1 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:border-primary focus:ring-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-gray-300 text-sm">Password</label>
                        <input
                            type="password"
                            name="password"
                            className="w-full px-4 py-2 mt-1 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:border-primary focus:ring-primary"
                            required
                        />
                    </div>

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center gap-2 bg-primary hover:bg-primary/80 text-white py-2 rounded-lg shadow-md transition mt-2"
                    >
                        {loading ? (
                            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                            <>
                                <LockClosedIcon className="w-5" />
                                Login
                            </>
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                    <hr className="flex-1 border-gray-700" />
                    <span className="text-gray-500 text-sm">OR</span>
                    <hr className="flex-1 border-gray-700" />
                </div>

                {/* Azure Login */}
                <button
                    onClick={azureLogin}
                    className="w-full flex justify-center items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg transition shadow"
                >
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                        className="w-5 h-5"
                        alt="ms"
                    />
                    Login with Azure
                    <ArrowRightIcon className="w-5" />
                </button>
            </div>
        </div>
    );
}
