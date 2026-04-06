import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const categories = ["Deep Work", "Creative", "Admin", "Social", "Errands"];
const effortLevels = ["Low", "Medium", "High"];

type JsonObject = Record<string, unknown>;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { task } = await req.json();
    if (!task || typeof task !== "string" || task.trim().length === 0) {
      return jsonResponse({ error: "Task text is required" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Classify the following task for a productivity planner.

Task: "${task.trim()}"

Return:
- category (Deep Work, Creative, Admin, Social, Errands)
- energy_required (1-5)
- effort_level (Low, Medium, High)

Return ONLY valid JSON:
{
  "category": "...",
  "energy_required": number,
  "effort_level": "..."
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a precise task classifier. Return only valid JSON with no markdown.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) return handleGatewayError(response, "AI classification failed");

    const data = await response.json();
    const parsed = parseJsonContent(data.choices?.[0]?.message?.content);
    const result = normalizeClassification(parsed);

    return jsonResponse(result);
  } catch (e) {
    console.error("classify-task error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function normalizeClassification(input: JsonObject) {
  const category = input.category;
  const effortLevel = input.effort_level;
  const energy = Number(input.energy_required);

  if (!categories.includes(category)) throw new Error("Invalid category returned");
  if (!effortLevels.includes(effortLevel)) throw new Error("Invalid effort level returned");
  if (!Number.isInteger(energy) || energy < 1 || energy > 5) {
    throw new Error("Invalid energy required returned");
  }

  return {
    category,
    energy_required: energy,
    effort_level: effortLevel,
  };
}

function parseJsonContent(content: string | null | undefined) {
  if (!content) throw new Error("No classification returned");
  const cleaned = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(cleaned);
}

async function handleGatewayError(response: Response, fallbackMessage: string) {
  if (response.status === 429) return jsonResponse({ error: "Rate limited, please try again later." }, 429);
  if (response.status === 402) return jsonResponse({ error: "AI credits exhausted. Please add funds." }, 402);

  const text = await response.text();
  console.error("AI gateway error:", response.status, text);
  return jsonResponse({ error: fallbackMessage }, 500);
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
