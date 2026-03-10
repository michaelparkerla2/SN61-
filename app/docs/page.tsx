"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Copy, Check, Terminal, Github, Database, Zap, Shield, Clock } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function DocsPage() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://your-app.vercel.app"

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">
                <span className="text-primary">SN</span>app<span className="text-primary">Y</span> Documentation
              </h1>
              <p className="text-sm text-muted-foreground">Complete setup and integration guide</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8 max-w-4xl">
        {/* What is SNappY */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">What is SNappY?</h2>
          <p className="text-muted-foreground leading-relaxed">
            SNappY (like a crab claw - snap!) is a persistent memory storage tool built exclusively for Claw bot 
            SN61 mining. It solves the problem of Claw forgetting what worked and what failed across iterations - 
            like when v6 resubmitted the same volatile signals that caused fragmentation issues, even though 
            it should have known better.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <Zap className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold">Fast Recall</p>
                    <p className="text-xs text-muted-foreground">Sub-100ms API calls</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Persistent</p>
                    <p className="text-xs text-muted-foreground">Never forgets</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Shield className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold">Searchable</p>
                    <p className="text-xs text-muted-foreground">Query by text/type</p>
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
                    <p className="font-semibold">Auto-Backup</p>
                    <p className="text-xs text-muted-foreground">Push to GitHub</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quick Start */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Quick Start (5 Minutes)</h2>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">1</span>
                  Deploy SNappY
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Click the Publish button in v0 to deploy to Vercel. Your Upstash Redis is already connected.
                </p>
                <p className="text-sm">
                  Your deployment URL will be: <code className="bg-muted px-2 py-1 rounded">https://your-project.vercel.app</code>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">2</span>
                  Download Python Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Download the Python client and add it to your Claw bot project:
                </p>
                <Button asChild className="gap-2">
                  <a href="/snappy_client.py" download>
                    <Download className="h-4 w-4" />
                    Download snappy_client.py
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">3</span>
                  Update URL in Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Open snappy_client.py and update the SNAPPY_URL:
                </p>
                <div className="relative">
                  <pre className="bg-muted p-3 rounded text-sm font-mono overflow-x-auto">
{`# Line 56 in snappy_client.py
SNAPPY_URL = "${baseUrl}"`}
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(`SNAPPY_URL = "${baseUrl}"`, "url")}
                  >
                    {copied === "url" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">4</span>
                  Add to Claw Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Import and use in your pipeline.py:
                </p>
                <div className="relative">
                  <pre className="bg-muted p-3 rounded text-sm font-mono overflow-x-auto">
{`from snappy_client import (
    log_submission, log_win, log_rejection, log_avoid,
    get_things_to_avoid, get_past_rejections, 
    get_winning_patterns, github_backup
)

# Before each iteration - load constraints
avoid_rules = get_things_to_avoid()
past_issues = get_past_rejections("fragmentation")
wins = get_winning_patterns()

# After submit
log_submission("v8", hash_value, ["font_enum", "canvas"])

# On result
if score >= 0.5:
    log_win("v8", score, signals)
else:
    log_rejection("v8", score, "reason here", "fix here")

# Hourly backup
github_backup("yourusername", "yourrepo")`}
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(`from snappy_client import (
    log_submission, log_win, log_rejection, log_avoid,
    get_things_to_avoid, get_past_rejections, 
    get_winning_patterns, github_backup
)`, "import")}
                  >
                    {copied === "import" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* GitHub Setup */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Github className="h-6 w-6" />
            GitHub Backup Setup (Optional)
          </h2>
          
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                To enable automatic GitHub backups, add a Personal Access Token to your Vercel deployment:
              </p>
              
              <ol className="space-y-3 text-sm">
                <li className="flex gap-2">
                  <span className="font-bold text-primary">1.</span>
                  Go to GitHub Settings → Developer settings → Personal access tokens → Generate new (classic)
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">2.</span>
                  Select the repo scope and generate
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">3.</span>
                  In v0, click the Settings button (top right) → Vars
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">4.</span>
                  Add a new variable: <code className="bg-muted px-2 py-0.5 rounded">GITHUB_PAT</code> = your token
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">5.</span>
                  Redeploy (Publish again)
                </li>
              </ol>
            </CardContent>
          </Card>
        </section>

        {/* API Reference */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Terminal className="h-6 w-6" />
            API Reference
          </h2>

          <div className="space-y-3">
            {[
              { method: "POST", path: "/api/store", desc: "Store a memory log" },
              { method: "GET", path: "/api/retrieve?key=xxx", desc: "Retrieve a memory by key" },
              { method: "GET", path: "/api/search?query=xxx&type=xxx", desc: "Search memories" },
              { method: "GET", path: "/api/history?limit=50", desc: "Get recent timeline" },
              { method: "POST", path: "/api/github-push", desc: "Backup to GitHub" },
              { method: "GET", path: "/api/bulk", desc: "Export all memories" },
            ].map((endpoint, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                  endpoint.method === "GET" ? "bg-success/20 text-success" : "bg-primary/20 text-primary"
                }`}>
                  {endpoint.method}
                </span>
                <code className="font-mono text-sm flex-1">{endpoint.path}</code>
                <span className="text-sm text-muted-foreground hidden sm:block">{endpoint.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Memory Types */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Memory Types</h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-success/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-success">win</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Successful submissions with positive scores. Use to identify patterns that work.
                </p>
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-destructive">rejection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Failed submissions. Always include reason and fix to learn from mistakes.
                </p>
              </CardContent>
            </Card>

            <Card className="border-warning/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-warning">plan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Future iteration plans. Log before starting a new version.
                </p>
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-destructive">avoid</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Permanent rules of things to NEVER do. Critical constraints.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t pt-8 mt-8">
          <p className="text-center text-sm text-muted-foreground">
            SNappY - Built for Claw Bot SN61 Mining
          </p>
        </footer>
      </div>
    </main>
  )
}
