"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react"

interface MethodGroup {
  count: number
  avgScore: number
  medianScore: number
  topScore: number
  acceptanceRate: number
  miners: Array<{
    uid: string
    score: number
    method: string
  }>
}

interface SignalEffectiveness {
  signal: string
  avgScore: number
  sampleSize: number
  trend: "hot" | "effective" | "saturated" | "risky" | "weak"
}

interface AnalysisData {
  timestamp: string
  methodGroups: {
    behavioral_detection: MethodGroup
    fingerprinting: MethodGroup
    unknown: MethodGroup
  }
  signalEffectiveness: SignalEffectiveness[]
  saturatedApproaches: string[]
  openLanes: string[]
  topInsight: string
}

interface AnalysisSummaryProps {
  data: AnalysisData | null
  isLoading: boolean
}

const trendColors: Record<string, string> = {
  hot: "bg-success text-success-foreground",
  effective: "bg-primary text-primary-foreground",
  saturated: "bg-warning text-warning-foreground",
  risky: "bg-destructive/80 text-destructive-foreground",
  weak: "bg-muted text-muted-foreground"
}

const trendLabels: Record<string, string> = {
  hot: "Hot",
  effective: "Effective",
  saturated: "Saturated",
  risky: "Risky",
  weak: "Weak"
}

export function AnalysisSummary({ data, isLoading }: AnalysisSummaryProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-6 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-8 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analysis Summary
          </CardTitle>
          <CardDescription>No analysis data available. Ingest data first.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const behavioral = data.methodGroups.behavioral_detection
  const fingerprinting = data.methodGroups.fingerprinting

  return (
    <div className="space-y-4">
      {/* Method Comparison Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Behavioral Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Miners</span>
                <span className="font-bold">{behavioral.count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Score</span>
                <span className="font-bold text-success">{(behavioral.avgScore * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Top Score</span>
                <span className="font-bold">{(behavioral.topScore * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Acceptance Rate</span>
                <span className="font-bold">{(behavioral.acceptanceRate * 100).toFixed(0)}%</span>
              </div>
              <Progress value={behavioral.avgScore * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-secondary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Fingerprinting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Miners</span>
                <span className="font-bold">{fingerprinting.count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Score</span>
                <span className="font-bold">{(fingerprinting.avgScore * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Top Score</span>
                <span className="font-bold">{(fingerprinting.topScore * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Acceptance Rate</span>
                <span className="font-bold">{(fingerprinting.acceptanceRate * 100).toFixed(0)}%</span>
              </div>
              <Progress value={fingerprinting.avgScore * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Signal Effectiveness */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Signal Effectiveness</CardTitle>
          <CardDescription>Performance of different detection techniques</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.signalEffectiveness.slice(0, 8).map((signal) => (
              <div key={signal.signal} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{signal.signal.replace(/_/g, " ")}</span>
                    <div className="flex items-center gap-2">
                      <Badge className={trendColors[signal.trend]} variant="secondary">
                        {trendLabels[signal.trend]}
                      </Badge>
                      <span className="text-sm text-muted-foreground">({signal.sampleSize})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={signal.avgScore * 100} className="h-2 flex-1" />
                    <span className="text-sm font-bold w-12 text-right">
                      {(signal.avgScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lanes */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Saturated Approaches
            </CardTitle>
            <CardDescription>Many miners using - higher similarity penalties</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.saturatedApproaches.length > 0 ? (
                data.saturatedApproaches.map((approach, i) => (
                  <li key={i} className="text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                    {approach}
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">No saturated approaches detected</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-success" />
              Open Lanes
            </CardTitle>
            <CardDescription>Underutilized techniques - opportunity</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.openLanes.length > 0 ? (
                data.openLanes.map((lane, i) => (
                  <li key={i} className="text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    {lane}
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">No open lanes identified</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Top Insight */}
      {data.topInsight && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <p className="text-sm font-medium">{data.topInsight}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
