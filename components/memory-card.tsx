"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, AlertTriangle, Lightbulb, Send } from "lucide-react"
import type { MemoryLog } from "@/lib/redis"

interface MemoryCardProps {
  log: MemoryLog & { key?: string }
}

const typeConfig = {
  win: {
    icon: CheckCircle,
    label: "Win",
    className: "bg-success text-success-foreground",
  },
  rejection: {
    icon: XCircle,
    label: "Rejection",
    className: "bg-destructive text-destructive-foreground",
  },
  plan: {
    icon: Lightbulb,
    label: "Plan",
    className: "bg-warning text-warning-foreground",
  },
  avoid: {
    icon: AlertTriangle,
    label: "Avoid",
    className: "bg-destructive/80 text-destructive-foreground",
  },
  submission: {
    icon: Send,
    label: "Submission",
    className: "bg-accent text-accent-foreground",
  },
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: "Pending",
    className: "bg-muted text-muted-foreground",
  },
  accepted: {
    icon: CheckCircle,
    label: "Accepted",
    className: "bg-success text-success-foreground",
  },
  rejected: {
    icon: XCircle,
    label: "Rejected",
    className: "bg-destructive text-destructive-foreground",
  },
}

export function MemoryCard({ log }: MemoryCardProps) {
  const typeInfo = typeConfig[log.type] || typeConfig.submission
  const statusInfo = statusConfig[log.status] || statusConfig.pending
  const TypeIcon = typeInfo.icon
  const StatusIcon = statusInfo.icon

  const formattedDate = log.timestamp
    ? new Date(log.timestamp).toLocaleString()
    : "Unknown date"

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${typeInfo.className}`}>
              <TypeIcon className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-sm">{log.version || log.id}</span>
              <p className="text-xs text-muted-foreground">{formattedDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className={typeInfo.className}>
              {typeInfo.label}
            </Badge>
            <Badge variant="outline" className={statusInfo.className}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {log.score !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Score:</span>
            <span className={`font-mono text-sm font-bold ${log.score >= 0.5 ? "text-success" : "text-destructive"}`}>
              {log.score.toFixed(2)}
            </span>
          </div>
        )}

        {log.hash && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Hash:</span>
            <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-[200px]">
              {log.hash}
            </code>
          </div>
        )}

        {log.signals && log.signals.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-xs font-medium text-muted-foreground mr-1">Signals:</span>
            {log.signals.map((signal, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {signal}
              </Badge>
            ))}
          </div>
        )}

        {log.reason && (
          <div className="bg-destructive/10 rounded-md p-2">
            <span className="text-xs font-medium text-destructive">Reason: </span>
            <span className="text-xs">{log.reason}</span>
          </div>
        )}

        {log.fix && (
          <div className="bg-success/10 rounded-md p-2">
            <span className="text-xs font-medium text-success">Fix: </span>
            <span className="text-xs">{log.fix}</span>
          </div>
        )}

        {log.notes && (
          <p className="text-xs text-muted-foreground italic">{log.notes}</p>
        )}
      </CardContent>
    </Card>
  )
}
