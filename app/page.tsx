"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MemoryCard } from "@/components/memory-card"
import { SearchForm } from "@/components/search-form"
import { AddMemoryForm } from "@/components/add-memory-form"
import { StatsCards } from "@/components/stats-cards"
import { ApiDocs } from "@/components/api-docs"
import { RefreshCw, Download, Github, Database, History, Code, BarChart3, Loader2 } from "lucide-react"
import type { MemoryLog } from "@/lib/redis"
import { Leaderboard } from "@/components/ridges/leaderboard"
import { AnalysisSummary } from "@/components/ridges/analysis-summary"
import { StrategyCard } from "@/components/ridges/strategy-card"
import { FrameworkMap } from "@/components/ridges/framework-map"
import { SimilarityChecker } from "@/components/ridges/similarity-checker"

export default function SNappYDashboard() {
  const [memories, setMemories] = useState<Array<MemoryLog & { key?: string }>>([])
  const [searchResults, setSearchResults] = useState<Array<MemoryLog & { key?: string }> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isStoring, setIsStoring] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  
  // Ridges state
  const [ridgesTab, setRidgesTab] = useState<"overview" | "strategy" | "similarity">("overview")
  const [isIngesting, setIsIngesting] = useState(false)
  const [ridgesLoading, setRidgesLoading] = useState(false)
  const [leaderboardData, setLeaderboardData] = useState<unknown>(null)
  const [analysisData, setAnalysisData] = useState<unknown>(null)
  const [recommendData, setRecommendData] = useState<unknown>(null)
  const [frameworkData, setFrameworkData] = useState<unknown>(null)
  const [lastIngest, setLastIngest] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/history?limit=100")
      const data = await response.json()
      setMemories(data.history || [])
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Failed to fetch history:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Ridges data fetching
  const fetchRidgesData = useCallback(async () => {
    setRidgesLoading(true)
    try {
      const [leaderboard, analysis, recommend, framework] = await Promise.all([
        fetch("/api/ridges/leaderboard").then(r => r.json()).catch(() => null),
        fetch("/api/ridges/analyze").then(r => r.json()).catch(() => null),
        fetch("/api/ridges/recommend").then(r => r.json()).catch(() => null),
        fetch("/api/ridges/framework-map").then(r => r.json()).catch(() => null)
      ])
      
      setLeaderboardData(leaderboard)
      setAnalysisData(analysis)
      setRecommendData(recommend)
      setFrameworkData(framework)
      
      // Get last ingest time
      const ingestStatus = await fetch("/api/ridges/ingest").then(r => r.json()).catch(() => null)
      if (ingestStatus?.lastIngest) {
        setLastIngest(ingestStatus.lastIngest)
      }
    } catch (error) {
      console.error("Failed to fetch Ridges data:", error)
    } finally {
      setRidgesLoading(false)
    }
  }, [])

  const handleIngest = async () => {
    setIsIngesting(true)
    try {
      const response = await fetch("/api/ridges/ingest", { method: "POST" })
      const data = await response.json()
      
      if (response.ok) {
        setLastIngest(data.timestamp)
        // Refresh all Ridges data after ingestion
        await fetchRidgesData()
      }
    } catch (error) {
      console.error("Failed to ingest:", error)
    } finally {
      setIsIngesting(false)
    }
  }

  const handleSearch = async (query: string, type: string) => {
    if (!query && !type) {
      setSearchResults(null)
      return
    }

    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set("query", query)
      if (type) params.set("type", type)

      const response = await fetch(`/api/search?${params}`)
      const data = await response.json()
      setSearchResults(data.matches || [])
    } catch (error) {
      console.error("Failed to search:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStore = async (data: { key: string; value: Record<string, unknown> }) => {
    setIsStoring(true)
    try {
      const response = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      
      if (response.ok) {
        await fetchHistory()
      }
    } catch (error) {
      console.error("Failed to store:", error)
    } finally {
      setIsStoring(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch("/api/bulk")
      const data = await response.json()
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `snappy-export-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to export:", error)
    }
  }

  const displayMemories = searchResults ?? memories

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d="M12 21c-4.418 0-8-3.582-8-8 0-2.21.895-4.21 2.343-5.657L12 2l5.657 5.343A7.957 7.957 0 0 1 20 13c0 4.418-3.582 8-8 8z" />
                  <path d="M8 14c0-1 .5-2 1.5-2.5" />
                  <path d="M16 14c0-1-.5-2-1.5-2.5" />
                  <circle cx="9" cy="11" r="1" />
                  <circle cx="15" cy="11" r="1" />
                  <path d="M6 8l-2-1" />
                  <path d="M18 8l2-1" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  <span className="text-primary">SN</span>app<span className="text-primary">Y</span>
                </h1>
                <p className="text-xs text-muted-foreground">Claw Bot Memory Storage</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 flex-1 sm:flex-none">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchHistory}
                disabled={isLoading}
                className="gap-2 flex-1 sm:flex-none"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>

          {lastRefresh && (
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <StatsCards memories={memories} />

        {/* Tabs */}
        <Tabs defaultValue="memories" className="space-y-4" onValueChange={(v) => {
          if (v === "ridges" && !leaderboardData) {
            fetchRidgesData()
          }
        }}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="memories" className="gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Memories</span>
            </TabsTrigger>
            <TabsTrigger value="ridges" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Ridges</span>
            </TabsTrigger>
            <TabsTrigger value="add" className="gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Add Memory</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Code className="h-4 w-4" />
              <span className="hidden sm:inline">API Docs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="memories" className="space-y-4">
            {/* Search */}
            <SearchForm onSearch={handleSearch} isLoading={isLoading} />

            {searchResults !== null && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Found {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                </p>
                <Button variant="ghost" size="sm" onClick={() => setSearchResults(null)}>
                  Clear Search
                </Button>
              </div>
            )}

            {/* Memory List */}
            {displayMemories.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/30">
                <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Memories Yet</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Start storing Claw bot submissions, wins, and rejections to build your memory bank.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {displayMemories.map((log, i) => (
                  <MemoryCard key={log.id || i} log={log} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="add">
            <AddMemoryForm onSubmit={handleStore} isLoading={isStoring} />
          </TabsContent>

          <TabsContent value="api">
            <ApiDocs />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>SNappY - Built for Claw Bot SN61 Mining</p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
