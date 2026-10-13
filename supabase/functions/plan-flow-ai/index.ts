import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const validTimes = ["Morning", "Afternoon", "Evening"];

type PlanTask = {
  title: string;
  category?: string | null;
  energy_required?: number | null;
  effort_level?: string | null;
};

type JsonObject = Record<string, unknown>;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { energy_level, mood: legacyMood, moods: rawMoods, tasks, local_context } = await req.json();
    const moodList: string[] = (Array.isArray(rawMoods) ? rawMoods : legacyMood ? [legacyMood] : [])
      .filter((m: unknown) => typeof m === "string")
      .slice(0, 2);
    const mood = moodList.join(" + ");
    if (!Number.isInteger(energy_level) || energy_level < 1 || energy_level > 5) {
      return jsonResponse({ error: "Energy level must be an integer from 1 to 5" }, 400);
    }
    if (!mood || typeof mood !== "string") {
      return jsonResponse({ error: "Mood is required" }, 400);
    }
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return jsonResponse({ error: "At least one task is required" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const safeTasks = tasks as PlanTask[];
    const taskList = safeTasks
      .map((task) => `- ${task.title} (${task.category ?? "Uncategorized"}, energy ${task.energy_required ?? 3}, effort ${task.effort_level ?? "Medium"})`)
      .join("\n");

    const prompt = `You are a calm, supportive productivity coach.

User state:
- Energy: ${energy_level}
- Mood: ${mood}
- Local date: ${typeof local_context?.localDate === "string" ? local_context.localDate : "Unknown"}
- Local clock time: ${typeof local_context?.localTime === "string" ? local_context.localTime : "Unknown"}
- Time zone: ${typeof local_context?.timeZone === "string" ? local_context.timeZone : "Unknown"}
- Current period: ${typeof local_context?.period === "string" ? local_context.period : "Unknown"}

Use the user's LOCAL time, not server time. Never assume it is morning.
Only suggest periods that have not passed today. In the evening (18:00 or later),
tasks requiring energy 4–5 should be saved for tomorrow morning, not started now,
even if the user reports high energy. Between midnight and 06:00, recommend rest
and defer work until after sleep. Explicitly say tomorrow/after sleep in the
suggestion when deferring. The schedule time for those deferred tasks is Morning.
For lighter tasks with a past preferred period, use the current or a later period.
Quote the EXACT original task title in advice so the user knows which task you mean.
Never rename tasks, and use exact original titles in schedule entries.

Tasks:
${taskList}

Suggest:
1. One small action they should start with
2. One thing they should avoid right now

Also, based on this user's energy and tasks, suggest when to do each task.

Assign each task to:
- Morning
- Afternoon
- Evening

Return ONLY valid JSON:
{
  "suggestion": {
    "try_first": "short, kind, practical suggestion",
    "avoid_now": "short, kind, practical caution"
  },
  "schedule": [
    { "task": "...", "time": "Morning" }
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
            content: "You are a calm, supportive productivity coach. Return only valid JSON with no markdown.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) return handleGatewayError(response, "Failed to generate AI plan");

    const data = await response.json();
    const parsed = parseJsonContent(data.choices?.[0]?.message?.content);
    const result = normalizePlan(parsed, safeTasks);

    return jsonResponse(result);
  } catch (e) {
    console.error("plan-flow-ai error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function normalizePlan(input: JsonObject, tasks: PlanTask[]) {
  const suggestion = isJsonObject(input.suggestion) ? input.suggestion : {};
  const tryFirst = String(suggestion.try_first ?? "").trim();
  const avoidNow = String(suggestion.avoid_now ?? "").trim();
  if (!tryFirst || !avoidNow) throw new Error("AI suggestion was incomplete");

  const taskTitles = new Set(tasks.map((task) => task.title));
  const schedule = Array.isArray(input.schedule)
    ? input.schedule
        .map((item) => {
          const scheduleItem = isJsonObject(item) ? item : {};
          return {
            task: String(scheduleItem.task ?? "").trim(),
            time: String(scheduleItem.time ?? "").trim(),
          };
        })
        .filter((item) => taskTitles.has(item.task) && validTimes.includes(item.time))
    : [];

  return {
    suggestion: {
      try_first: tryFirst,
      avoid_now: avoidNow,
    },
    schedule,
  };
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJsonContent(content: string | null | undefined) {
  if (!content) throw new Error("No AI plan returned");
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
