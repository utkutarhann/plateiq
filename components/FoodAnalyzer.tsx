"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image-utils";
import { Tooltip } from "@/components/ui/Tooltip";

interface AnalysisResult {
    food_name: string;
    portion_size: "small" | "medium" | "large";
    weight_grams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    confidence_score?: number;
    items?: {
        name: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        weight_grams: number;
    }[];
}

export default function FoodAnalyzer({ isAuthenticated = true }: { isAuthenticated?: boolean }) {
    const router = useRouter();
    // Auth check removed for public access
    const isUserAuthenticated = true;
    const [images, setImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dailyCount, setDailyCount] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auth effect removed

    useEffect(() => {
        const fetchDailyCount = async () => {
            const { getDailyAnalysisCount } = await import("@/app/actions/food-logger");
            const count = await getDailyAnalysisCount();
            setDailyCount(count);
        };
        fetchDailyCount();
    }, []);

    const isLimitReached = dailyCount !== null && dailyCount >= 2;

    const [editForm, setEditForm] = useState<AnalysisResult | null>(null);

    // Store initial ratios for auto-calculation
    const [ratios, setRatios] = useState<{ cal: number; prot: number; carb: number; fat: number } | null>(null);

    const [isDragging, setIsDragging] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            addImages(newFiles);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            const newFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
            addImages(newFiles);
        }
    };

    const addImages = (newFiles: File[]) => {
        setImages(prev => [...prev, ...newFiles]);
        const newUrls = newFiles.map(file => URL.createObjectURL(file));
        setPreviewUrls(prev => [...prev, ...newUrls]);
        setResult(null);
        setError(null);
        setIsEditing(false);
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
        if (images.length <= 1) {
            setResult(null);
            setIsEditing(false);
        }
    };



    // ... (inside FoodAnalyzer component)

    const handleAnalyze = async () => {
        console.log("handleAnalyze started", { imagesLength: images.length });
        if (images.length === 0) {
            console.log("No images to analyze");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log("Starting image compression...");
            const base64Promises = images.map(async (file) => {
                console.log(`Compressing file: ${file.name}, size: ${file.size}`);
                if (file.size > 10 * 1024 * 1024) { // 10MB limit before compression
                    throw new Error(`"${file.name}" çok büyük (Max 10MB).`);
                }
                const compressed = await compressImage(file);
                console.log(`Compression complete for ${file.name}`);
                return compressed;
            });

            const base64Images = await Promise.all(base64Promises);
            console.log("All images compressed, sending to API...");

            const response = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ images: base64Images }),
            });

            console.log("API response received", { status: response.status });
            const data = await response.json();

            if (!response.ok) {
                console.error("API error:", data);
                throw new Error(data.error || "Analiz başarısız oldu.");
            }

            console.log("Analysis successful", data);
            setResult(data);
            setEditForm(data);

            // Calculate ratios per gram
            if (data.weight_grams > 0) {
                setRatios({
                    cal: data.calories / data.weight_grams,
                    prot: data.protein / data.weight_grams,
                    carb: data.carbs / data.weight_grams,
                    fat: data.fat / data.weight_grams,
                });
            }

            setIsEditing(true);

        } catch (err: any) {
            console.error("handleAnalyze error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleWeightChange = (newWeight: number) => {
        if (!editForm || !ratios) return;

        setEditForm({
            ...editForm,
            weight_grams: newWeight,
            calories: Math.round(newWeight * ratios.cal),
            protein: Math.round(newWeight * ratios.prot),
            carbs: Math.round(newWeight * ratios.carb),
            fat: Math.round(newWeight * ratios.fat),
        });
    };

    const handleSave = async () => {
        if (!editForm) return;

        setSaving(true);
        setError(null);

        try {
            // Use Server Action for logging to handle gamification
            const { logFood } = await import("@/app/actions/food-logger");

            await logFood({
                image_url: "placeholder", // In a real app, upload to storage first
                food_name: editForm.food_name,
                portion_size: editForm.portion_size,
                weight_grams: editForm.weight_grams,
                calories: editForm.calories,
                protein: editForm.protein,
                carbs: editForm.carbs,
                fat: editForm.fat,
                corrected_by_user: JSON.stringify(result) !== JSON.stringify(editForm)
            });

            // Use window.location for more reliable redirect
            window.location.href = "/dashboard?success=meal_logged";

        } catch (err: any) {
            console.error("Save error:", err);
            setError("Kaydedilirken hata oluştu: " + (err.message || "Bilinmeyen hata"));
            setSaving(false);
        }
    };

    return (
        <div style={{ width: "100%", maxWidth: "800px", margin: "0 auto" }}>
            <div style={{
                padding: "1.5rem",
                marginBottom: "2rem",
                background: "rgba(255, 255, 255, 0.6)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                borderRadius: "1.5rem",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.1)"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", color: "hsl(var(--foreground))" }}>
                        Fotoğraf Yükle
                    </h3>
                    {/* Daily limit tooltip removed */}
                </div>

                {/* Limit check removed */}
                {false ? (
                    <div style={{
                        padding: "3rem 2rem",
                        textAlign: "center",
                        backgroundColor: "rgba(255, 255, 255, 0.4)",
                        borderRadius: "1.5rem",
                        border: "2px dashed #e5e7eb",
                        color: "hsl(var(--muted-foreground))"
                    }}>
                        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🕒</div>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "0.5rem", color: "hsl(var(--foreground))" }}>
                            Bugünlük Bu Kadar!
                        </h3>
                        <p style={{ marginBottom: "1.5rem" }}>Günlük 2 ücretsiz analiz hakkınızı doldurdunuz.<br />Yarın 00:00'da 2 yeni hak kazanacaksın.</p>

                        <div style={{
                            background: "linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)",
                            padding: "1.5rem",
                            borderRadius: "1rem",
                            color: "white",
                            marginBottom: "1rem",
                            boxShadow: "0 10px 25px -5px rgba(139, 92, 246, 0.4)"
                        }}>
                            <h4 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "0.5rem" }}>🚀 Sınırsız Analiz için Premium'a Geç</h4>
                            <p style={{ fontSize: "0.9rem", opacity: 0.9, marginBottom: "1rem" }}>Sınırsız yemek analizi, detaylı raporlar ve daha fazlası.</p>
                            <ul style={{ textAlign: "left", fontSize: "0.9rem", marginBottom: "1.5rem", listStyle: "none", padding: 0 }}>
                                <li style={{ marginBottom: "0.5rem" }}>✅ Sınırsız Fotoğraf Analizi</li>
                                <li style={{ marginBottom: "0.5rem" }}>✅ Detaylı Makro Raporları</li>
                                <li>✅ Reklamsız Deneyim</li>
                            </ul>
                            <button className="btn" style={{
                                width: "100%",
                                background: "white",
                                color: "#8b5cf6",
                                fontWeight: "700",
                                padding: "0.75rem",
                                borderRadius: "0.5rem",
                                border: "none",
                                cursor: "pointer"
                            }}>
                                Premium'a Yükselt (₺29.99/ay)
                            </button>
                        </div>
                    </div>
                ) : false ? (
                    <div
                        onClick={() => router.push("/login")}
                        style={{
                            border: "4px dashed rgba(0,0,0,0.1)",
                            borderRadius: "1.5rem",
                            padding: "4rem 2rem",
                            textAlign: "center",
                            cursor: "pointer",
                            backgroundColor: "rgba(255, 255, 255, 0.4)",
                            marginBottom: "2rem",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "1.5rem",
                        }}
                        className="group hover:bg-white/80 hover:shadow-lg"
                    >
                        <div style={{
                            width: "90px",
                            height: "90px",
                            borderRadius: "50%",
                            backgroundColor: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "3rem",
                            color: "hsl(var(--muted-foreground))",
                            boxShadow: "0 10px 25px -5px rgba(0,0,0, 0.1)",
                        }}>
                            🔒
                        </div>
                        <div>
                            <h3 style={{
                                fontSize: "1.75rem",
                                fontWeight: "800",
                                marginBottom: "0.5rem",
                                color: "hsl(var(--foreground))",
                                letterSpacing: "-0.02em"
                            }}>
                                Analiz İçin <span style={{ color: "hsl(var(--primary))", textDecoration: "underline", textDecorationThickness: "4px", textDecorationColor: "hsl(var(--primary)/0.2)" }}>Giriş Yapın</span>
                            </h3>
                            <p style={{ fontSize: "1.1rem", color: "hsl(var(--muted-foreground))", maxWidth: "400px", margin: "0 auto" }}>
                                Fotoğraf yüklemek ve besin değerlerini öğrenmek için ücretsiz hesap oluşturun.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        style={{
                            border: isDragging ? "4px dashed hsl(var(--primary))" : "4px dashed rgba(0,0,0,0.1)",
                            borderRadius: "1.5rem",
                            padding: "4rem 2rem",
                            textAlign: "center",
                            cursor: "pointer",
                            backgroundColor: isDragging ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.4)",
                            marginBottom: "2rem",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "1.5rem",
                            position: "relative",
                            overflow: "hidden",
                            transform: isDragging ? "scale(1.02)" : "scale(1)"
                        }}
                        className="group hover:bg-white/80 hover:shadow-lg"
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*"
                            multiple
                            style={{ display: "none" }}
                        />

                        {/* Pulsing Icon Container */}
                        <div style={{ position: "relative" }}>
                            <div style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                width: "120%",
                                height: "120%",
                                borderRadius: "50%",
                                border: "2px solid hsl(var(--primary))",
                                opacity: 0,
                                animation: isDragging ? "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite" : "none"
                            }} />
                            <div style={{
                                width: "90px",
                                height: "90px",
                                borderRadius: "50%",
                                backgroundColor: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "3rem",
                                color: isDragging ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                                boxShadow: "0 10px 25px -5px rgba(0,0,0, 0.1)",
                                zIndex: 1,
                                transition: "all 0.3s ease",
                                transform: isDragging ? "scale(1.1) rotate(10deg)" : "scale(1)"
                            }}>
                                📸
                            </div>
                        </div>

                        <div>
                            <h3 style={{
                                fontSize: "1.75rem",
                                fontWeight: "800",
                                marginBottom: "0.5rem",
                                color: "hsl(var(--foreground))",
                                letterSpacing: "-0.02em"
                            }}>
                                Fotoğraf Yüklemek İçin <span style={{ color: "hsl(var(--primary))", textDecoration: "underline", textDecorationThickness: "4px", textDecorationColor: "hsl(var(--primary)/0.2)" }}>Dokun</span>
                            </h3>
                            <p style={{ fontSize: "1.1rem", color: "hsl(var(--muted-foreground))", maxWidth: "400px", margin: "0 auto" }}>
                                veya fotoğrafı buraya sürükleyip bırak 📥
                            </p>
                            <p style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", marginTop: "1rem", opacity: 0.7 }}>
                                Desteklenen formatlar: JPG, PNG, WEBP
                            </p>
                        </div>
                    </div>
                )}

                {previewUrls.length > 0 && (
                    <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
                        {previewUrls.map((url, idx) => (
                            <div key={idx} style={{ position: "relative", flexShrink: 0, width: "100px", height: "100px" }}>
                                <Image src={url} alt={`Preview ${idx}`} fill style={{ objectFit: "cover", borderRadius: "1rem" }} />
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                                    style={{
                                        position: "absolute", top: -5, right: -5,
                                        background: "red", color: "white", borderRadius: "50%",
                                        width: "24px", height: "24px", border: "2px solid white", cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                                    }}
                                >✕</button>
                            </div>
                        ))}
                    </div>
                )}

                {error && (
                    <div style={{
                        padding: "1rem",
                        marginBottom: "1rem",
                        backgroundColor: "#fee2e2",
                        border: "1px solid #ef4444",
                        borderRadius: "0.5rem",
                        color: "#b91c1c",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        animation: "shake 0.5s ease-in-out"
                    }}>
                        <span style={{ fontSize: "1.25rem" }}>⚠️</span>
                        <p style={{ fontWeight: "500" }}>{error}</p>
                    </div>
                )}

                {previewUrls.length > 0 && !loading && !isEditing && !result && (
                    <button onClick={handleAnalyze} className="btn btn-primary" style={{ width: "100%", marginTop: "1rem", padding: "1rem", fontSize: "1.1rem" }}>
                        Analiz Et ✨
                    </button>
                )}

                {loading && (
                    <div style={{ textAlign: "center", marginTop: "2rem", animation: "fadeIn 0.5s ease" }}>
                        <div style={{ width: "100%", height: "6px", backgroundColor: "#f3f4f6", borderRadius: "999px", overflow: "hidden", marginBottom: "1rem" }}>
                            <div style={{
                                width: "100%",
                                height: "100%",
                                backgroundColor: "#8b5cf6",
                                borderRadius: "999px",
                                animation: "progress 2s ease-in-out infinite"
                            }} />
                        </div>
                        <style jsx>{`
                            @keyframes progress {
                                0% { transform: translateX(-100%); }
                                50% { transform: translateX(0); }
                                100% { transform: translateX(100%); }
                            }
                        `}</style>
                        <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#4b5563", marginBottom: "0.5rem" }}>AI Analiz Ediyor...</h4>
                        <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>Fotoğrafınız inceleniyor, besin değerleri hesaplanıyor.</p>
                        <p style={{ fontSize: "0.8rem", color: "#d1d5db", marginTop: "0.5rem" }}>Yaklaşık 5 saniye...</p>
                    </div>
                )}
            </div>

            {(isEditing || result) && editForm && (
                <div className="card" style={{ padding: "2rem", animation: "slideUp 0.5s ease" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <div>
                            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                                {isEditing ? "Sonuçları Doğrula" : "Analiz Sonucu"}
                            </h2>
                            {editForm.confidence_score && (
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
                                    <div style={{ width: "100px", height: "6px", backgroundColor: "#e5e7eb", borderRadius: "999px", overflow: "hidden" }}>
                                        <div style={{ width: `${editForm.confidence_score}%`, height: "100%", backgroundColor: editForm.confidence_score > 80 ? "#22c55e" : editForm.confidence_score > 50 ? "#eab308" : "#ef4444" }}></div>
                                    </div>
                                    <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>%{editForm.confidence_score} Güven</span>
                                </div>
                            )}
                        </div>
                        {isEditing && (
                            <span style={{ fontSize: "0.875rem", color: "hsl(var(--secondary))", backgroundColor: "hsl(var(--secondary)/0.1)", padding: "0.25rem 0.75rem", borderRadius: "999px" }}>
                                Düzenleme Modu
                            </span>
                        )}
                    </div>

                    <div style={{ display: "grid", gap: "1.5rem" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.5rem", color: "hsl(var(--muted-foreground))" }}>Yemek Adı</label>
                                <input
                                    className="input"
                                    value={editForm.food_name}
                                    disabled={!isEditing}
                                    onChange={(e) => setEditForm({ ...editForm, food_name: e.target.value })}
                                    style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))", fontSize: "1.1rem", fontWeight: "bold" }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.5rem", color: "hsl(var(--muted-foreground))" }}>Gramaj (g)</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={editForm.weight_grams}
                                    disabled={!isEditing}
                                    onChange={(e) => handleWeightChange(Number(e.target.value))}
                                    style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))" }}
                                />
                            </div>
                        </div>

                        {/* Item Breakdown List */}
                        {editForm.items && editForm.items.length > 0 && (
                            <div style={{ background: "hsl(var(--muted)/0.3)", borderRadius: "1rem", padding: "1rem" }}>
                                <h4 style={{ fontSize: "0.9rem", fontWeight: "600", marginBottom: "0.75rem", color: "hsl(var(--muted-foreground))" }}>Tespit Edilen İçerikler</h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                    {editForm.items.map((item: any, idx: number) => (
                                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem", background: "white", borderRadius: "0.5rem", fontSize: "0.9rem" }}>
                                            <span style={{ fontWeight: "500" }}>{item.name}</span>
                                            <div style={{ display: "flex", gap: "1rem", color: "hsl(var(--muted-foreground))" }}>
                                                <span>{item.weight_grams}g</span>
                                                <span>{item.calories} kcal</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <MacroInput label="Kalori" field="calories" value={editForm.calories} unit="kcal" color="hsl(var(--macro-calories))" isEditing={isEditing} onChange={(v) => setEditForm({ ...editForm, calories: v })} />
                            <MacroInput label="Protein" field="protein" value={editForm.protein} unit="g" color="hsl(var(--macro-protein))" isEditing={isEditing} onChange={(v) => setEditForm({ ...editForm, protein: v })} />
                            <MacroInput label="Karb" field="carbs" value={editForm.carbs} unit="g" color="hsl(var(--macro-carbs))" isEditing={isEditing} onChange={(v) => setEditForm({ ...editForm, carbs: v })} />
                            <MacroInput label="Yağ" field="fat" value={editForm.fat} unit="g" color="hsl(var(--macro-fat))" isEditing={isEditing} onChange={(v) => setEditForm({ ...editForm, fat: v })} />
                        </div>

                        {isEditing ? (
                            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="btn btn-primary"
                                    style={{
                                        flex: 1,
                                        padding: "1rem",
                                        fontSize: "1.1rem",
                                        opacity: saving ? 0.7 : 1,
                                        cursor: saving ? "not-allowed" : "pointer"
                                    }}
                                >
                                    {saving ? "⏳ Kaydediliyor..." : "✅ Doğrula ve Kaydet"}
                                </button>
                                <button
                                    onClick={() => { setIsEditing(false); setResult(null); }}
                                    disabled={saving}
                                    className="btn"
                                    style={{ padding: "1rem", backgroundColor: "#fee2e2", color: "#dc2626" }}
                                >
                                    İptal
                                </button>
                            </div>
                        ) : (
                            <div style={{ marginTop: "1rem", textAlign: "center", color: "hsl(var(--primary))", fontWeight: "500" }}>
                                🎉 Kaydedildi!
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

interface MacroInputProps {
    label: string;
    field: string;
    value: number;
    unit: string;
    color: string;
    isEditing: boolean;
    onChange: (value: number) => void;
}

function MacroInput({ label, value, unit, color, isEditing, onChange }: MacroInputProps) {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1rem", backgroundColor: "hsl(var(--background))", borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))" }}>
            <span style={{ fontSize: "0.875rem", color: "hsl(var(--muted-foreground))", marginBottom: "0.5rem" }}>{label}</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
                <input
                    type="number"
                    value={value}
                    disabled={!isEditing}
                    onChange={(e) => onChange(Number(e.target.value))}
                    style={{
                        width: "60px",
                        textAlign: "center",
                        fontSize: "1.25rem",
                        fontWeight: "bold",
                        color: color,
                        border: isEditing ? "1px solid hsl(var(--border))" : "none",
                        background: "transparent",
                        padding: "0.25rem"
                    }}
                />
                <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>{unit}</span>
            </div>
        </div>
    );
}
