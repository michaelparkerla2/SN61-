"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Copy, Check, Code, Terminal, Github } from "lucide-react"

export function ApiDocs() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://your-app.vercel.app"

  const endpoints = [
    {
      method: "POST",
      path: "/api/store",
      description: "Store a memory log",
      example: `curl -X POST ${baseUrl}/api/store \\
  -H "Content-Type: application/json" \\
  -d '{"key": "dfp_v7", "value": {"type": "submission", "version": "v7", "status": "pending", "signals": ["font_enum", "raf_cadence"]}}'`,
    },
    {
      method: "GET",
      path: "/api/retrieve",
      description: "Retrieve a memory by key",
      example: `curl "${baseUrl}/api/retrieve?key=dfp_v7"`,
    },
    {
      method: "GET",
      path: "/api/search",
      description: "Search memories by query or type",
      example: `curl "${baseUrl}/api/search?query=fragmentation&type=rejection"`,
    },
    {
      method: "GET",
      path: "/api/history",
      description: "Get recent memory timeline",
      example: `curl "${baseUrl}/api/history?limit=50"`,
    },
    {
      method: "POST",
      path: "/api/github-push",
      description: "Backup all memories to GitHub",
      example: `curl -X POST ${baseUrl}/api/github-push \\
  -H "Content-Type: application/json" \\
  -d '{"owner": "yourusername", "repo": "yourrepo", "filePath": "memory/snappy-logs.json"}'`,
    },
    {
      method: "GET",
      path: "/api/bulk",
      description: "Export all memories as JSON",
      example: `curl "${baseUrl}/api/bulk"`,
    },
    {
      method: "POST",
      path: "/api/sync-redfeed",
      description: "Sync RedTeam intel into SNappY",
      example: `curl -X POST "${baseUrl}/api/sync-redfeed"`,
    },
  ]

  const pythonCode = `import requests

SNAPPY_URL = "${baseUrl}"

def store_log(key: str, value: dict) -> dict:
    """Store a memory log in SNappY"""
    response = requests.post(
        f"{SNAPPY_URL}/api/store",
        json={"key": key, "value": value}
    )
    return response.json()

def retrieve_log(key: str) -> dict:
    """Retrieve a memory by key"""
    response = requests.get(
        f"{SNAPPY_URL}/api/retrieve",
        params={"key": key}
    )
    return response.json().get("value")

def search_logs(query: str = "", log_type: str = "") -> list:
    """Search memories by query text or type"""
    params = {}
    if query:
        params["query"] = query
    if log_type:
        params["type"] = log_type
    response = requests.get(
        f"{SNAPPY_URL}/api/search",
        params=params
    )
    return response.json().get("matches", [])

def get_history(limit: int = 50) -> list:
    """Get recent memory timeline"""
    response = requests.get(
        f"{SNAPPY_URL}/api/history",
        params={"limit": limit}
    )
    return response.json().get("history", [])

def github_backup(owner: str = "michaelparkerla2", repo: str = "SN61-", file_path: str = "memory/snappy-logs.json") -> dict:
    """Backup all memories to GitHub repo (defaults to michaelparkerla2/SN61-)"""
    response = requests.post(
        f"{SNAPPY_URL}/api/github-push",
        json={"owner": owner, "repo": repo, "filePath": file_path}
    )
    return response.json()

def sync_redfeed() -> dict:
    """Sync RedTeam data into SNappY memories"""
    response = requests.post(f"{SNAPPY_URL}/api/sync-redfeed")
    return response.json()

# ========== CLAW BOT INTEGRATION ==========
# Add these to your pipeline.py or crons

# After submission:
# store_log("dfp_v7", {
#     "type": "submission",
#     "version": "v7",
#     "status": "pending",
#     "hash": "90b4b466...",
#     "signals": ["font_enum", "raf_cadence"],
#     "notes": "deterministic, no volatile"
# })

# On rejection:
# store_log("dfp_v7_reject", {
#     "type": "rejection",
#     "version": "v7",
#     "status": "rejected",
#     "score": 0.4,
#     "reason": "high fragmentation from performance.now",
#     "fix": "remove volatile timestamp, use deterministic hash"
# })

# On win:
# store_log("dfp_v7_win", {
#     "type": "win",
#     "version": "v7",
#     "status": "accepted",
#     "score": 0.85,
#     "signals": ["font_enum", "canvas_hash"],
#     "notes": "deterministic signals only, 0 fragmentation"
# })

# Before iteration - check what NOT to do:
# past_issues = search_logs("fragmentation", "rejection")
# for issue in past_issues:
#     print(f"AVOID: {issue['value'].get('reason')}")

# Hourly cron - sync RedFeed and backup:
# sync_redfeed()  # Pull latest RedTeam intel
# github_backup()  # Defaults to michaelparkerla2/SN61-
`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          API Reference & Claw Integration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="endpoints">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="endpoints" className="gap-2">
              <Terminal className="h-4 w-4" />
              Endpoints
            </TabsTrigger>
            <TabsTrigger value="python" className="gap-2">
              <Github className="h-4 w-4" />
              Claw Integration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="endpoints" className="space-y-4 mt-4">
            {endpoints.map((endpoint, i) => (
              <div key={i} className="border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                      endpoint.method === "GET" ? "bg-success/20 text-success" : "bg-primary/20 text-primary"
                    }`}>
                      {endpoint.method}
                    </span>
                    <code className="font-mono text-sm">{endpoint.path}</code>
                  </div>
                  <span className="text-sm text-muted-foreground">{endpoint.description}</span>
                </div>
                <div className="relative">
                  <pre className="p-3 bg-card text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                    {endpoint.example}
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(endpoint.example, i)}
                  >
                    {copiedIndex === i ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="python" className="mt-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-muted/50">
                <span className="font-mono text-sm">snappy_client.py</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(pythonCode, 100)}
                >
                  {copiedIndex === 100 ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span className="ml-2 text-xs">Copy All</span>
                </Button>
              </div>
              <pre className="p-4 bg-card text-xs font-mono overflow-x-auto max-h-[500px] overflow-y-auto">
                {pythonCode}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
