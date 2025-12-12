import { NextResponse } from "next/server";
import OpenAI from "openai";
import { AnalyzeRequestSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export async function POST(request: Request) {
    try {
        // 1. Rate Limiting
        const ip = (await headers()).get("x-forwarded-for") || "unknown";
        if (!rateLimit(ip)) {
            return NextResponse.json(
                { error: "Çok fazla istek gönderdiniz. Lütfen 1 dakika bekleyin." },
                { status: 429 }
            );
        }

        const body = await request.json();

        // 2. Input Validation (Zod)
        const validationResult = AnalyzeRequestSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Geçersiz veri formatı", details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const { images } = validationResult.data;

        // 3. Authentication & Daily Limit Check REMOVED for public access
        // const { createClient } = await import("@/lib/supabase/server");
        // const supabase = await createClient();
        // const { data: { user } } = await supabase.auth.getUser();

        // if (!user) {
        //     return NextResponse.json(
        //         { error: "Analiz yapmak için giriş yapmalısınız." },
        //         { status: 401 }
        //     );
        // }

        // Daily limit check removed

        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey || apiKey === "") {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            return NextResponse.json({
                food_name: "Izgara Tavuk & Salata (Demo)",
                portion_size: "medium",
                weight_grams: 350,
                calories: 450,
                protein: 45,
                carbs: 12,
                fat: 22,
                confidence_score: 85,
                is_mock: true
            });
        }

        const openai = new OpenAI({ apiKey });

        const content: any[] = [
            { type: "text", text: "Bu yemeğin besin değerleri nedir? Birden fazla açıdan çekilmiş fotoğrafları birleştirerek tek bir porsiyon için tahmin yap." },
        ];

        images.forEach((img: string) => {
            content.push({
                type: "image_url",
                image_url: {
                    url: img,
                },
            });
        });

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Sen uzman bir diyetisyensin. Gönderilen yemek fotoğraflarını analiz et ve şu JSON formatında yanıt ver:
          {
            "food_name": "Yemeğin genel adı (örn: Izgara Tavuk Menü)",
            "portion_size": "small" | "medium" | "large",
            "weight_grams": toplam_tahmini_gramaj,
            "calories": toplam_kalori,
            "protein": toplam_protein,
            "carbs": toplam_karbonhidrat,
            "fat": toplam_yağ,
            "items": [
              { "name": "Alt kalem adı (örn: Tavuk)", "calories": 200, "protein": 30, "carbs": 0, "fat": 5, "weight_grams": 150 },
              { "name": "Alt kalem adı (örn: Pilav)", "calories": 150, "protein": 3, "carbs": 30, "fat": 1, "weight_grams": 100 }
            ],
            "confidence_score": 0-100 arası güven skoru
          }
          Sadece JSON döndür, başka açıklama yapma.`,
                },
                {
                    role: "user",
                    content: content,
                },
            ],
            max_tokens: 500,
        });

        const responseContent = response.choices[0].message.content;
        const jsonStr = responseContent?.replace(/```json/g, "").replace(/```/g, "").trim();

        if (!jsonStr) {
            throw new Error("AI yanıtı boş");
        }

        const result = JSON.parse(jsonStr);
        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Analysis error:", error);
        return NextResponse.json(
            { error: error.message || "Analiz sırasında bir hata oluştu" },
            { status: 500 }
        );
    }
}
