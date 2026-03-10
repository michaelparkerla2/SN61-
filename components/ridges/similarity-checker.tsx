"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Search, Shield, AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react"

interface MinerPrediction {
  uid: string
  score: number
  predictedSimilarity: number
  risk: "low" | "medium" | "high"
  reason: string
}

interface PredictionResult {
  predictions: MinerPrediction[]
  maxSimilarity: number
  safeToSubmit: boolean
  guidance: string
  ourSignals: string[]
  timestamp: string
}

export function SimilarityChecker() {
  const [description, setDescription] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCheck = async () => {
    if (!description.trim()) {
      setError("Please enter a description of your approach")
      return
    }

    setIsChecking(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/ridges/predict-similarity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to predict similarity")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check similarity")
    } finally {
      setIsChecking(false)
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "low":
        return <CheckCircle className="h-4 w-4 text-success" />
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-warning" />
      case "high":
        return <XCircle className="h-4 w-4 text-destructive" />
      default:
        return null
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "bg-success/10 border-success/20 text-success"
      case "medium":
        return "bg-warning/10 border-warning/20 text-warning"
      case "high":
        return "bg-destructive/10 border-destructive/20 text-destructive"
      default:
        return ""
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Similarity Checker
        </CardTitle>
        <CardDescription>
          Predict similarity to known miners before submitting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Describe your approach</label>
          <Textarea
            placeholder="Async behavioral detection using event tracking with weighted scoring system. Monitors mousemove, keyboard, focus/blur events. Uses RAF callback cadence analysis and error stack depth fingerprinting..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Be specific about the signals and techniques you plan to use
          </p>
        </div>

        <Button
          onClick={handleCheck}
          disabled={isChecking || !description.trim()}
          className="w-full"
        >
          {isChecking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Predict Similarity
            </>
          )}
        </Button>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4 pt-4 border-t">
            {/* Safety Status */}
            <Alert className={result.safeToSubmit ? "border-success bg-success/5" : "border-destructive bg-destructive/5"}>
              {result.safeToSubmit ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <AlertTitle>
                {result.safeToSubmit ? "Safe to Submit" : "High Risk - Reconsider"}
              </AlertTitle>
              <AlertDescription>{result.guidance}</AlertDescription>
            </Alert>

            {/* Max Similarity */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <span className="font-medium">Maximum Similarity</span>
              <Badge
                variant="outline"
                className={`text-lg px-3 py-1 ${
                  result.maxSimilarity < 0.35 ? "bg-success/10 text-success" :
                  result.maxSimilarity < 0.45 ? "bg-warning/10 text-warning" :
                  "bg-destructive/10 text-destructive"
                }`}
              >
                {(result.maxSimilarity * 100).toFixed(0)}%
              </Badge>
            </div>

            {/* Detected Signals */}
            {result.ourSignals && result.ourSignals.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Detected Signals in Your Description</h4>
                <div className="flex flex-wrap gap-2">
                  {result.ourSignals.map((signal) => (
                    <Badge key={signal} variant="secondary">
                      {signal.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Predictions Table */}
            <div>
              <h4 className="text-sm font-medium mb-2">Comparison to Top Miners</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {result.predictions.slice(0, 10).map((pred) => (
                  <div
                    key={pred.uid}
                    className={`flex items-center justify-between p-3 rounded-lg border ${getRiskColor(pred.risk)}`}
                  >
                    <div className="flex items-center gap-3">
                      {getRiskIcon(pred.risk)}
                      <div>
                        <div className="font-medium">UID {pred.uid}</div>
                        <div className="text-xs text-muted-foreground">{pred.reason}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{(pred.predictedSimilarity * 100).toFixed(0)}%</div>
                      <div className="text-xs text-muted-foreground">
                        Score: {(pred.score * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
