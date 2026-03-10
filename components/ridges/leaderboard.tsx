"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trophy, ChevronDown, ChevronUp } from "lucide-react"

interface LeaderboardEntry {
  rank: number
  uid: string
  score: number
  penalty: number
  challenge: string
  methodType: string
  methodSummary: string
  scoredAt: string
}

interface LeaderboardStats {
  totalScored: number
  accepted: number
  rejected: number
  avgAcceptedScore: number
  avgPenalty: number
}

interface LeaderboardProps {
  data: {
    leaderboard: LeaderboardEntry[]
    stats: LeaderboardStats
    lastUpdated: string
  } | null
  isLoading: boolean
}

export function Leaderboard({ data, isLoading }: LeaderboardProps) {
  const [expanded, setExpanded] = useState(false)
  const [selectedMiner, setSelectedMiner] = useState<LeaderboardEntry | null>(null)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.leaderboard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Leaderboard
          </CardTitle>
          <CardDescription>No data available. Ingest data first.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const displayEntries = expanded ? data.leaderboard : data.leaderboard.slice(0, 10)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Leaderboard
            </CardTitle>
            <CardDescription>
              {data.stats.totalScored} scored | {data.stats.accepted} accepted | {data.stats.rejected} rejected
            </CardDescription>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div>Avg Score: {(data.stats.avgAcceptedScore * 100).toFixed(0)}%</div>
            <div>Avg Penalty: {(data.stats.avgPenalty * 100).toFixed(0)}%</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayEntries.map((entry) => (
            <Dialog key={`${entry.uid}-${entry.rank}`}>
              <DialogTrigger asChild>
                <div
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedMiner(entry)}
                >
                  <div className="flex items-center gap-4">
                    <span className={`font-bold w-8 text-center ${
                      entry.rank <= 3 ? "text-primary" : "text-muted-foreground"
                    }`}>
                      #{entry.rank}
                    </span>
                    <div>
                      <div className="font-medium">UID {entry.uid}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-[200px] md:max-w-[300px]">
                        {entry.methodSummary}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={entry.methodType === "behavioral_detection" ? "default" : "secondary"}
                      className="hidden sm:inline-flex"
                    >
                      {entry.methodType === "behavioral_detection" ? "Behavioral" : "Fingerprint"}
                    </Badge>
                    <div className="text-right">
                      <div className={`font-bold ${
                        entry.score >= 0.9 ? "text-success" : 
                        entry.score >= 0.7 ? "text-warning" : "text-muted-foreground"
                      }`}>
                        {(entry.score * 100).toFixed(0)}%
                      </div>
                      {entry.penalty > 0 && (
                        <div className="text-xs text-destructive">
                          -{(entry.penalty * 100).toFixed(0)}% penalty
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Miner UID {entry.uid} Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Rank</div>
                      <div className="font-bold">#{entry.rank}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Score</div>
                      <div className="font-bold text-success">{(entry.score * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Penalty</div>
                      <div className="font-bold text-destructive">{(entry.penalty * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Challenge</div>
                      <div className="font-bold uppercase">{entry.challenge}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Method Type</div>
                    <Badge variant={entry.methodType === "behavioral_detection" ? "default" : "secondary"}>
                      {entry.methodType === "behavioral_detection" ? "Behavioral Detection" : "Fingerprinting"}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Method Summary</div>
                    <p className="text-sm bg-muted p-3 rounded">{entry.methodSummary}</p>
                  </div>
                  {entry.scoredAt && (
                    <div>
                      <div className="text-sm text-muted-foreground">Scored At</div>
                      <div className="text-sm">{new Date(entry.scoredAt).toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>

        {data.leaderboard.length > 10 && (
          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Show All ({data.leaderboard.length})
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
