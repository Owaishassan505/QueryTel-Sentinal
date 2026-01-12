import { useState } from "react";
import { apiFetch } from "../api/api";
import { useSearchParams } from "react-router-dom";

export default function TwoFA() {
    const [params] = useSearchParams();
    const email = params.get("email");

    const [code, setCode] = useState("");
    const [error, setError] = useState("");

    async function submitCode(e) {
        e.preventDefault();
        setError("");

        const res = await apiFetch("/api/2fa/verify", {
            method: "POST",
            body: JSON.stringify({ email, code })
        });

        if (!res.ok) {
            setError("Invalid code");
            return;
        }

        localStorage.setItem("token", res.data.token);
        window.location.href = "/";
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="p-6 bg-gray-800 rounded-xl w-full max-w-md">
                <h2 className="text-white text-xl mb-4 text-center">
                    Enter Authentication Code
                </h2>

                {error && (
                    <div className="bg-red-600/20 text-red-300 p-2 rounded mb-2">
                        {error}
                    </div>
                )}

                <form onSubmit={submitCode}>
                    <input
                        type="text"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full p-3 bg-gray-700 text-white rounded"
                        placeholder="6-digit code"
                        autoFocus
                    />
                    <button className="w-full mt-4 bg-primary text-white p-3 rounded">
                        Verify
                    </button>
                </form>
            </div>
        </div>
    );
}
