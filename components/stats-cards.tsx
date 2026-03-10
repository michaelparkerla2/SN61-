"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, Clock, Database } from "lucide-react"
import type { MemoryLog } from "@/lib/redis"

interface StatsCardsProps {
  memories: Array<MemoryLog & { key?: string }>
}

export function StatsCards({ memories }: StatsCardsProps) {
  const stats = {
    total: memories.length,
    wins: memories.filter(m => m.type === "win" || m.status === "accepted").length,
    rejections: memories.filter(m => m.type === "rejection" || m.status === "rejected").length,
    pending: memories.filter(m => m.status === "pending").length,
  }

  const winRate = stats.total > 0 
    ? ((stats.wins / (stats.wins + stats.rejections)) * 100).toFixed(1)
    : "0.0"

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Memories</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{stats.wins}</p>
              <p className="text-xs text-muted-foreground">Wins ({winRate}%)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">{stats.rejections}</p>
              <p className="text-xs text-muted-foreground">Rejections</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
