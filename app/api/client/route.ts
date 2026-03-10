import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "snappy_client.py")
    const content = await fs.readFile(filePath, "utf-8")
    
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": "attachment; filename=snappy_client.py",
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read client file" },
      { status: 500 }
    )
  }
}
