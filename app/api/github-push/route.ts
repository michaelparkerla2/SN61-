import { NextRequest, NextResponse } from "next/server"
import { redis, SNAPPY_PREFIX } from "@/lib/redis"

// POST /api/github-push - Push memory to GitHub repo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      filePath = "memory/snappy-logs.json", 
      content,
      owner = "michaelparkerla2",
      repo = "SN61-",
      message = "Update SNappY memory backup"
    } = body as {
      filePath?: string
      content?: unknown
      owner?: string
      repo?: string
      message?: string
    }

    // Get GitHub PAT from env
    const githubToken = process.env.GITHUB_PAT
    if (!githubToken) {
      return NextResponse.json(
        { error: "GITHUB_PAT not configured. Add it to your environment variables." },
        { status: 400 }
      )
    }

    // If no content provided, export all SNappY memory
    let exportContent = content
    if (!exportContent) {
      const keys = await redis.keys(`${SNAPPY_PREFIX}*`)
      const allMemory: Record<string, unknown> = {}
      
      for (const key of keys) {
        if (key === `${SNAPPY_PREFIX}history`) {
          const history = await redis.lrange(key, 0, -1)
          allMemory.history = history.map(h => typeof h === "string" ? JSON.parse(h) : h)
        } else {
          const value = await redis.get(key)
          allMemory[key] = typeof value === "string" ? JSON.parse(value) : value
        }
      }
      
      exportContent = {
        exportedAt: new Date().toISOString(),
        source: "SNappY",
        memory: allMemory,
      }
    }

    // GitHub API: Get current file SHA if exists
    const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`
    
    let sha: string | undefined
    try {
      const getResponse = await fetch(apiBase, {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      })
      if (getResponse.ok) {
        const data = await getResponse.json()
        sha = data.sha
      }
    } catch {
      // File doesn't exist yet, that's fine
    }

    // Create or update file
    const putResponse = await fetch(apiBase, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        content: Buffer.from(JSON.stringify(exportContent, null, 2)).toString("base64"),
        sha,
      }),
    })

    if (!putResponse.ok) {
      const error = await putResponse.text()
      return NextResponse.json(
        { error: `GitHub API error: ${error}` },
        { status: putResponse.status }
      )
    }

    const result = await putResponse.json()

    return NextResponse.json({
      status: "pushed",
      filePath,
      commitSha: result.commit?.sha,
      url: result.content?.html_url,
    })
  } catch (error) {
    console.error("GitHub push error:", error)
    return NextResponse.json(
      { error: "Failed to push to GitHub" },
      { status: 500 }
    )
  }
}
