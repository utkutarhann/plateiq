"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";

import LoginModal from "./LoginModal";

export default function HeaderAuth({ initialUser }: { initialUser: any }) {
    const [user, setUser] = useState(initialUser);
    const [loading, setLoading] = useState(!initialUser);
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    useEffect(() => {
        const supabase = createClient();

        // Check session on mount if no user provided or just to verify
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoading(false);
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading && !user) {
        return (
            <div className="btn btn-primary" style={{
                borderRadius: "999px",
                padding: "0.75rem 1.5rem",
                boxShadow: "0 4px 15px hsla(var(--primary), 0.3)",
                fontSize: "0.95rem",
                opacity: 0.7
            }}>
                ...
            </div>
        );
    }

    if (user) {
        return (
            <Link href="/dashboard/profile" style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                textDecoration: "none",
                background: "white",
                padding: "0.5rem 1rem 0.5rem 0.5rem",
                borderRadius: "999px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
            }}>
                <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "2px solid hsl(var(--primary))",
                }}>
                    {user?.user_metadata?.avatar_url ? (
                        <img src={user?.user_metadata?.avatar_url} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                        <div style={{ width: "100%", height: "100%", background: "hsl(var(--primary))", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>
                            {user?.email?.[0].toUpperCase()}
                        </div>
                    )}
                </div>
                <span style={{ fontWeight: "600", color: "#333", fontSize: "0.9rem", display: "none" }} className="sm:inline">Profilim</span>
            </Link>
        );
    }

    return (
        <>
            <button
                onClick={() => setIsLoginOpen(true)}
                className="btn btn-primary"
                style={{
                    borderRadius: "999px",
                    padding: "0.75rem 1.5rem",
                    boxShadow: "0 4px 15px hsla(var(--primary), 0.3)",
                    fontSize: "0.95rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    border: "none"
                }}
            >
                <span>→]</span> MEMBER LOGIN
            </button>
            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </>
    );
}
