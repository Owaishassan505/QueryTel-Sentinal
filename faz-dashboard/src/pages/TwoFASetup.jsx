import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import { useSearchParams } from "react-router-dom";

export default function TwoFASetup() {
    const [params] = useSearchParams();
    const email = params.get("email");

    const [qr, setQr] = useState("");
    const [secret, setSecret] = useState("");

    useEffect(() => {
        async function load() {
            const token = localStorage.getItem("token");
            const res = await apiFetch("/api/2fa/setup", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setQr(res.data.qr);
                setSecret(res.data.secret);
            }
        }
        load();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="p-6 bg-gray-800 rounded-xl w-full max-w-md text-center text-white">
                <h2 className="text-xl mb-4">Setup Two-Factor Authentication</h2>

                <img src={qr} alt="QR Code" className="mx-auto w-64" />

                <p className="text-gray-400 mt-4">Secret Key:</p>
                <p className="text-primary font-mono">{secret}</p>

                <p className="mt-4 text-sm text-gray-400">
                    Add this to Google/Microsoft Authenticator and continue login.
                </p>
            </div>
        </div>
    );
}
