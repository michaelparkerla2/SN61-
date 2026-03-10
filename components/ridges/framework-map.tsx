"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Grid3X3, Wifi, Radio, AlertTriangle, CheckCircle } from "lucide-react"

interface FrameworkInfo {
  name: string
  instances: number
  webdriver: boolean
  websocket: boolean
  detectionRate: number
  totalTests: number
  detected: number
}

interface TestStructure {
  totalTests: number
  humanTests: number
  botTests: number
  frameworks: FrameworkInfo[]
}

interface FrameworkMapProps {
  data: {
    testStructure: TestStructure
    hardestToDetect: string[]
    easiestToDetect: string[]
    insight: string
    timestamp: string
  } | null
  isLoading: boolean
}

export function FrameworkMap({ data, isLoading }: FrameworkMapProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Framework Detection Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.testStructure) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Framework Detection Map
          </CardTitle>
          <CardDescription>No framework data available. Ingest data first.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { testStructure, hardestToDetect, easiestToDetect, insight } = data

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5" />
              Framework Detection Map
            </CardTitle>
            <CardDescription>
              {testStructure.totalTests} tests | {testStructure.botTests} bot | {testStructure.humanTests} human
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Framework Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {testStructure.frameworks.map((framework) => {
            const isHard = hardestToDetect.includes(framework.name)
            const isEasy = easiestToDetect.includes(framework.name)
            
            return (
              <div
                key={framework.name}
                className={`p-3 rounded-lg border ${
                  isHard ? "border-destructive/50 bg-destructive/5" :
                  isEasy ? "border-success/50 bg-success/5" :
                  "border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm truncate">{framework.name}</span>
                  {isHard && <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />}
                  {isEasy && <CheckCircle className="h-4 w-4 text-success shrink-0" />}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Progress 
                      value={framework.detectionRate * 100} 
                      className={`h-1.5 flex-1 ${
                        framework.detectionRate < 0.6 ? "[&>div]:bg-destructive" :
                        framework.detectionRate < 0.8 ? "[&>div]:bg-warning" :
                        "[&>div]:bg-success"
                      }`}
                    />
                    <span className="font-mono w-10 text-right">
                      {(framework.detectionRate * 100).toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {framework.websocket && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        <Wifi className="h-3 w-3 mr-1" />
                        WS
                      </Badge>
                    )}
                    {framework.webdriver && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        <Radio className="h-3 w-3 mr-1" />
                        WD
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          
          {/* Human Tests Card */}
          <div className="p-3 rounded-lg border border-primary/50 bg-primary/5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">human</span>
              <Badge variant="default" className="text-xs">Control</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {testStructure.humanTests} tests - must pass all
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-destructive" />
            <span className="text-muted-foreground">Hard to detect ({'<'}70%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-warning" />
            <span className="text-muted-foreground">Medium (70-80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-success" />
            <span className="text-muted-foreground">Easy ({'>'}80%)</span>
          </div>
        </div>

        {/* Hardest/Easiest Lists */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Hardest to Detect
            </h4>
            <div className="flex flex-wrap gap-2">
              {hardestToDetect.length > 0 ? (
                hardestToDetect.map((fw) => (
                  <Badge key={fw} variant="outline" className="bg-destructive/10">
                    {fw}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">None identified</span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-success/5 border border-success/20">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              Easiest to Detect
            </h4>
            <div className="flex flex-wrap gap-2">
              {easiestToDetect.length > 0 ? (
                easiestToDetect.map((fw) => (
                  <Badge key={fw} variant="outline" className="bg-success/10">
                    {fw}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">None identified</span>
              )}
            </div>
          </div>
        </div>

        {/* Insight */}
        {insight && (
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm">{insight}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
