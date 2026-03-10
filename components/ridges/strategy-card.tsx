"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target, CheckCircle, AlertCircle, XCircle, Sparkles } from "lucide-react"

interface SignalRecommendation {
  name: string
  reason: string
}

interface Recommendation {
  approach: "behavioral_detection" | "fingerprinting"
  confidence: number
  reasoning: string
  signals: {
    must_use: SignalRecommendation[]
    should_use: SignalRecommendation[]
    avoid: SignalRecommendation[]
  }
  noveltyGuidance: string
  estimatedScore: string
}

interface StrategyCardProps {
  data: {
    recommendation: Recommendation
    timestamp: string
  } | null
  isLoading: boolean
}

export function StrategyCard({ data, isLoading }: StrategyCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Strategy Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-6 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.recommendation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Strategy Recommendation
          </CardTitle>
          <CardDescription>No recommendation available. Ingest and analyze data first.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const rec = data.recommendation

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Strategy Recommendation
            </CardTitle>
            <CardDescription>Based on competitive analysis</CardDescription>
          </div>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {(rec.confidence * 100).toFixed(0)}% confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Approach */}
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg">
              {rec.approach === "behavioral_detection" ? "Behavioral Detection" : "Fingerprinting"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
        </div>

        {/* Signal Lists */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Must Use */}
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2 text-success">
              <CheckCircle className="h-4 w-4" />
              Must Use
            </h4>
            <ul className="space-y-2">
              {rec.signals.must_use.map((signal, i) => (
                <li key={i} className="text-sm p-2 rounded bg-success/10 border border-success/20">
                  <div className="font-medium">{signal.name.replace(/_/g, " ")}</div>
                  <div className="text-xs text-muted-foreground">{signal.reason}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* Should Use */}
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2 text-primary">
              <AlertCircle className="h-4 w-4" />
              Should Use
            </h4>
            <ul className="space-y-2">
              {rec.signals.should_use.map((signal, i) => (
                <li key={i} className="text-sm p-2 rounded bg-primary/10 border border-primary/20">
                  <div className="font-medium">{signal.name.replace(/_/g, " ")}</div>
                  <div className="text-xs text-muted-foreground">{signal.reason}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* Avoid */}
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2 text-destructive">
              <XCircle className="h-4 w-4" />
              Avoid
            </h4>
            <ul className="space-y-2 max-h-[300px] overflow-y-auto">
              {rec.signals.avoid.slice(0, 6).map((signal, i) => (
                <li key={i} className="text-sm p-2 rounded bg-destructive/10 border border-destructive/20">
                  <div className="font-medium">{signal.name.replace(/_/g, " ")}</div>
                  <div className="text-xs text-muted-foreground">{signal.reason}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Novelty Guidance */}
        <div className="p-4 rounded-lg bg-muted">
          <h4 className="font-semibold mb-2">Novelty Guidance</h4>
          <p className="text-sm text-muted-foreground">{rec.noveltyGuidance}</p>
        </div>

        {/* Estimated Score */}
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <span className="text-sm font-medium">Estimated Score Range</span>
          <Badge variant="outline" className="text-base">{rec.estimatedScore}</Badge>
        </div>
      </CardContent>
    </Card>
  )
}
