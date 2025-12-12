"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
    const router = useRouter();

    if (!isOpen) return null;

    const handleMagicLinkLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setMessage({ type: "error", text: error.message });
        } else {
            setMessage({ type: "success", text: "Giriş bağlantısı e-posta adresinize gönderildi!" });
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            animation: "fadeIn 0.2s ease-out"
        }} onClick={onClose}>
            <div style={{
                backgroundColor: "#0f172a", // Dark blue/slate background like screenshot
                color: "white",
                padding: "2.5rem",
                borderRadius: "1.5rem",
                width: "100%",
                maxWidth: "420px",
                position: "relative",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                border: "1px solid rgba(255,255,255,0.1)"
            }} onClick={e => e.stopPropagation()}>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute",
                        top: "1.25rem",
                        right: "1.25rem",
                        background: "transparent",
                        border: "none",
                        color: "#94a3b8",
                        cursor: "pointer",
                        fontSize: "1.5rem",
                        padding: "0.5rem",
                        lineHeight: 1
                    }}
                >
                    ✕
                </button>

                {/* Icon */}
                <div style={{
                    width: "64px",
                    height: "64px",
                    backgroundColor: "#6366f1", // Indigo
                    borderRadius: "1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1.5rem auto",
                    fontSize: "2rem"
                }}>
                    ✉️
                </div>

                <h2 style={{ textAlign: "center", fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
                    Tekrar Hoşgeldiniz
                </h2>
                <p style={{ textAlign: "center", color: "#94a3b8", marginBottom: "2rem", fontSize: "0.95rem" }}>
                    Premium hesabınıza erişmek için e-postanızı girin
                </p>

                <form onSubmit={handleMagicLinkLogin}>
                    <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", color: "#64748b", marginBottom: "0.5rem", letterSpacing: "0.05em" }}>
                            E-POSTA ADRESİ
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="isim@ornek.com"
                            style={{
                                width: "100%",
                                padding: "0.75rem 1rem",
                                backgroundColor: "#1e293b",
                                border: "1px solid #334155",
                                borderRadius: "0.5rem",
                                color: "white",
                                fontSize: "1rem",
                                outline: "none"
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "0.75rem",
                            backgroundColor: "#6366f1",
                            color: "white",
                            border: "none",
                            borderRadius: "0.5rem",
                            fontSize: "1rem",
                            fontWeight: "600",
                            cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.7 : 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem",
                            marginBottom: "1.5rem"
                        }}
                    >
                        {loading ? "Gönderiliyor..." : "Giriş Kodunu Gönder →"}
                    </button>
                </form>

                {message && (
                    <div style={{
                        padding: "0.75rem",
                        borderRadius: "0.5rem",
                        marginBottom: "1.5rem",
                        backgroundColor: message.type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                        color: message.type === "success" ? "#4ade80" : "#f87171",
                        fontSize: "0.9rem",
                        textAlign: "center"
                    }}>
                        {message.text}
                    </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                    <div style={{ flex: 1, height: "1px", backgroundColor: "#334155" }}></div>
                    <span style={{ color: "#64748b", fontSize: "0.75rem", fontWeight: "bold" }}>VEYA ŞUNUNLA DEVAM ET</span>
                    <div style={{ flex: 1, height: "1px", backgroundColor: "#334155" }}></div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    style={{
                        width: "100%",
                        padding: "0.75rem",
                        backgroundColor: "white",
                        color: "#1e293b",
                        border: "none",
                        borderRadius: "0.5rem",
                        fontSize: "1rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.75rem",
                        marginBottom: "2rem"
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                </button>

                <div style={{ textAlign: "center", color: "#4ade80", fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                    <span style={{ width: "6px", height: "6px", backgroundColor: "#4ade80", borderRadius: "50%" }}></span>
                    Güvenli Giriş
                </div>
            </div>
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
