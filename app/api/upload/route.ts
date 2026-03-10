import { put, list } from '@vercel/blob';
import { NextRequest } from 'next/server';

// Create a unique key for each miner entry to detect duplicates
function createMinerKey(miner: Record<string, string>): string {
  const uid = miner['Miner UID'] || '';
  const digest = miner['Image Digest'] || '';
  const commitTime = miner['Commit Time'] || '';
  return `${uid}|${digest}|${commitTime}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return Response.json({ error: 'Empty CSV file' }, { status: 400 });
    }

    // Parse CSV
    const headers = parseCSVLine(lines[0]);
    const newRows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || '';
      });
      if (Object.keys(row).length > 0 && row[headers[0]]) {
        newRows.push(row);
      }
    }

    // Try to fetch existing data to merge with
    let existingMiners: Record<string, string>[] = [];
    let existingHeaders: string[] = headers;
    
    try {
      const { blobs } = await list({ prefix: 'redteam-data.json' });
      if (blobs.length > 0) {
        const response = await fetch(blobs[0].url, { cache: 'no-store' });
        const existingData = await response.json();
        existingMiners = existingData.miners || [];
        existingHeaders = existingData.headers || headers;
      }
    } catch {
      // No existing data, start fresh
    }

    // Merge: use a Map to dedupe by composite key (UID + Digest + Commit Time)
    const minerMap = new Map<string, Record<string, string>>();
    
    // Add existing miners first
    for (const miner of existingMiners) {
      const key = createMinerKey(miner);
      minerMap.set(key, miner);
    }
    
    // Add/update with new miners (new data takes precedence)
    let newCount = 0;
    let updatedCount = 0;
    for (const miner of newRows) {
      const key = createMinerKey(miner);
      if (minerMap.has(key)) {
        updatedCount++;
      } else {
        newCount++;
      }
      minerMap.set(key, miner);
    }

    // Convert back to array and sort by commit time (newest first)
    const mergedMiners = Array.from(minerMap.values()).sort((a, b) => {
      const timeA = a['Commit Time'] || '';
      const timeB = b['Commit Time'] || '';
      return timeB.localeCompare(timeA);
    });

    // Merge headers (in case new CSV has different columns)
    const allHeaders = [...new Set([...existingHeaders, ...headers])];

    const timestamp = new Date().toISOString();
    const dateKey = timestamp.split('T')[0];
    
    const data = {
      timestamp,
      source: 'csv-upload',
      headers: allHeaders,
      rowCount: mergedMiners.length,
      miners: mergedMiners,
    };

    // Store merged data
    const blob = await put('redteam-data.json', JSON.stringify(data, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
    });

    // Also store daily snapshot in history
    await put(`redteam-history/${dateKey}.json`, JSON.stringify(data, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
    });

    return Response.json({
      success: true,
      message: `Merged ${newCount} new entries, updated ${updatedCount} existing entries`,
      timestamp,
      totalMiners: mergedMiners.length,
      newEntries: newCount,
      updatedEntries: updatedCount,
      blobUrl: blob.url,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }, { status: 500 });
  }
}

// Parse a CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}
