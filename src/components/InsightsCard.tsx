import { Insight } from "@/lib/flowEngine";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InsightsCardProps {
  insights: Insight[];
  loading: boolean;
  onFetch: () => void;
}

export function InsightsCard({ insights, loading, onFetch }: InsightsCardProps) {
  return (
    <div className="flow-card space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Your Patterns</h2>
        </div>
        <Button variant="outline" size="sm" onClick={onFetch} disabled={loading} className="rounded-xl">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Get Insight
            </>
          )}
        </Button>
      </div>

      {insights.length > 0 && (
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <div
              key={`${insight.title}-${i}`}
              className="rounded-xl bg-accent/50 p-4 space-y-1 animate-fade-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{insight.emoji}</span>
                <span className="text-sm font-semibold text-foreground">{insight.title}</span>
              </div>
              <p className="text-sm text-muted-foreground pl-7">{insight.text}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && insights.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Click "Get Insight" after a few days to see AI-powered productivity patterns ✨
        </p>
      )}
    </div>
  );
}
