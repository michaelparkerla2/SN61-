import { list } from '@vercel/blob';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // List ALL blobs to find our data
    const { blobs } = await list();
    
    // Find the redteam-data.json blob (check both exact match and contains)
    const dataBlob = blobs.find(b => 
      b.pathname === 'redteam-data.json' || 
      b.pathname.includes('redteam-data')
    );
    
    if (!dataBlob) {
      return Response.json({ 
        success: false, 
        error: 'No data available yet. Upload a CSV first.',
        debug: {
          totalBlobs: blobs.length,
          blobNames: blobs.map(b => b.pathname)
        },
        rowCount: 0,
        miners: [] 
      }, { status: 404 });
    }

    // Fetch the actual data
    const response = await fetch(dataBlob.url, { cache: 'no-store' });
    
    if (!response.ok) {
      return Response.json({ 
        success: false, 
        error: `Blob fetch failed: ${response.status}`,
        rowCount: 0,
        miners: []
      }, { status: 500 });
    }
    
    const text = await response.text();
    
    // Check if it's actually JSON
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<')) {
      return Response.json({ 
        success: false, 
        error: 'Blob returned HTML instead of JSON - file may not exist',
        rowCount: 0,
        miners: []
      }, { status: 500 });
    }
    
    const data = JSON.parse(text);

    // Return clean, simple JSON for agents to parse easily
    return Response.json({
      success: true,
      timestamp: data.timestamp,
      rowCount: data.rowCount,
      headers: data.headers,
      miners: data.miners,
    });

  } catch (error) {
    console.error('Fetch error:', error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      rowCount: 0,
      miners: []
    }, { status: 500 });
  }
}
