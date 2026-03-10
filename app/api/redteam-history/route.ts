import { list } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // List all historical data files
    const { blobs } = await list({ prefix: 'redteam-history/' });
    
    if (blobs.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'No historical data yet',
        history: [] 
      });
    }

    // Sort by date descending
    const sortedBlobs = blobs.sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    // Return list of available dates with URLs
    const history = sortedBlobs.map(blob => ({
      date: blob.pathname.replace('redteam-history/', '').replace('.json', ''),
      url: blob.url,
      uploadedAt: blob.uploadedAt,
    }));

    return Response.json({
      success: true,
      count: history.length,
      history,
    });

  } catch (error) {
    console.error('History fetch error:', error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch history',
      history: []
    }, { status: 500 });
  }
}
