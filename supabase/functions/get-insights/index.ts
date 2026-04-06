import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type DataRow = {
  created_at: string;
};

type DailyLogRow = DataRow & {
  energy_level: number;
  mood: string;
  notes?: string | null;
};

type TaskRow = DataRow & {
  title: string;
  tag?: string | null;
  energy_required?: number | null;
  effort_level?: string | null;
  completed?: boolean | null;
};

type JsonObject = Record<string, unknown>;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [logsResult, tasksResult] = await Promise.all([
      supabase
        .from("daily_logs")
        .select("*")
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false }),
      supabase
        .from("tasks")
        .select("*")
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false }),
    ]);

    if (logsResult.error) throw logsResult.error;
    if (tasksResult.error) throw tasksResult.error;

    const logs = (logsResult.data || []) as DailyLogRow[];
    const tasks = (tasksResult.data || []) as TaskRow[];
    const dataDays = new Set(
      [...logs, ...tasks].map((item) => new Date(item.created_at).toISOString().slice(0, 10))
    );

    if (dataDays.size < 3) {
      return jsonResponse({
        insights: [
          {
            emoji: "\uD83C\uDF31",
            title: "Patterns Need Time",
            text: "Use FlowState for at least 3 different days, then I can spot more meaningful energy patterns.",
          },
        ],
      });
    }

    const weeklyData = {
      energy_logs: logs.map((log) => ({
        energy: log.energy_level,
        mood: log.mood,
        notes: log.notes,
        date: log.created_at,
      })),
      completed_tasks: tasks
        .filter((task) => task.completed)
        .map((task) => ({
          title: task.title,
          category: task.tag,
          energy_required: task.energy_required,
          effort_level: task.effort_level,
          date: task.created_at,
        })),
      moods: logs.map((log) => ({ mood: log.mood, date: log.created_at })),
    };

    const prompt = `Analyze this user's productivity patterns.

Data:
${JSON.stringify(weeklyData)}

Give 2 short insights:
- One about energy patterns
- One actionable suggestion

Keep it concise and encouraging.

Return ONLY valid JSON:
{
  "insights": [
    { "emoji": "single emoji", "title": "Energy Pattern", "text": "..." },
    { "emoji": "single emoji", "title": "Try This", "text": "..." }
  ]
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
            content: "You are a kind, concise productivity coach. Return only valid JSON with no markdown.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) return handleGatewayError(response, "Failed to generate insights");

    const data = await response.json();
    const parsed = parseJsonContent(data.choices?.[0]?.message?.content);
    const insights = normalizeInsights(parsed);

    return jsonResponse({ insights });
  } catch (e) {
    console.error("get-insights error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function normalizeInsights(input: JsonObject) {
  if (!Array.isArray(input.insights)) throw new Error("No insights returned");

  return input.insights
    .slice(0, 2)
    .map((insight, index: number) => {
      const insightObject = isJsonObject(insight) ? insight : {};
      return {
        emoji: String(insightObject.emoji || (index === 0 ? "\u26A1" : "\uD83C\uDF3F")),
        title: String(insightObject.title || (index === 0 ? "Energy Pattern" : "Try This")),
        text: String(insightObject.text || "").trim(),
      };
    })
    .filter((insight) => insight.text.length > 0);
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJsonContent(content: string | null | undefined) {
  if (!content) throw new Error("No insights returned");
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
