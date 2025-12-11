import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import FoodAnalyzer from "@/components/FoodAnalyzer";
import HowItWorks from "@/components/HowItWorks";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect logic removed to allow Landing Page display


  return (
    <main style={{ overflowX: "hidden", minHeight: "100vh", position: "relative" }}>
      {/* Background Image with Fade to White Gradient */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: "url('/dashboard-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        zIndex: -1
      }} />
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.6) 60%, rgba(255,255,255,1) 90%)",
        zIndex: -1
      }} />

      {/* Header Navigation - Transparent */}
      {/* Header Navigation - Transparent */}
      <nav style={{
        padding: "1rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
      }}>
        {/* Left: Home / Logo Button */}
        <Link href="/" style={{
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{ fontSize: "1.75rem", fontWeight: "900", color: "#333", letterSpacing: "-0.03em" }}>
              Plate<span style={{ color: "hsl(var(--primary))" }}>IQ</span>
            </span>
            <span style={{ fontSize: "0.65rem", color: "#666", fontWeight: "600", letterSpacing: "0.05em", marginTop: "2px" }}>
              Eat. Snap. Nurture.
            </span>
          </div>
        </Link>

        {/* Right: Profile Button */}
        <div>
          {user ? (
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
                {/* Safe access for user metadata */}
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
          ) : (
            <Link href="/login" className="btn btn-primary" style={{
              borderRadius: "999px",
              padding: "0.75rem 1.5rem",
              boxShadow: "0 4px 15px hsla(var(--primary), 0.3)",
              fontSize: "0.95rem"
            }}>
              Giriş Yap
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Content */}
      <section className="container" style={{
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: "2rem",
        textAlign: "center",
        position: "relative",
        paddingLeft: "1rem",
        paddingRight: "1rem"
      }}>

        <div style={{ maxWidth: "800px", marginBottom: "2rem" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            backgroundColor: "white",
            color: "hsl(var(--primary))",
            borderRadius: "999px",
            fontWeight: "600",
            marginBottom: "1.5rem",
            fontSize: "0.8rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
          }}>
            <span style={{ fontSize: "1rem" }}>✨</span> Yapay Zeka Destekli Beslenme Asistanı
          </div>

          <h1 style={{
            fontSize: "clamp(2.5rem, 8vw, 5rem)",
            fontWeight: "800",
            marginBottom: "1rem",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "#1a1a1a"
          }}>
            utku <span style={{ color: "hsl(var(--primary))" }}>tarhan</span>
          </h1>

          <p style={{
            fontSize: "1.1rem",
            color: "#4a4a4a",
            fontWeight: "500",
            maxWidth: "600px",
            margin: "0 auto",
            lineHeight: 1.6
          }}>
            Yemek fotoğrafını yükle, saniyeler içinde kalori, protein ve makro değerlerini öğren.
          </p>
        </div>

        {/* Food Analyzer Card */}
        <div style={{
          width: "100%",
          maxWidth: "900px",
          marginBottom: "4rem"
        }}>
          <div className="card" style={{
            padding: "1rem",
            borderRadius: "2rem",
            background: "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.8)",
            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)"
          }}>
            <FoodAnalyzer isAuthenticated={!!user} />
          </div>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer style={{
        padding: "2rem 0",
        textAlign: "center",
        color: "#888",
        fontSize: "0.9rem",
        position: "relative",
        zIndex: 1
      }}>
        <p>&copy; 2024 PlateIQ. (v2.5)</p>
      </footer>
    </main >
  );
}

