import { list } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // List ALL blobs to see what's stored
    const { blobs } = await list();
    
    return Response.json({
      success: true,
      totalBlobs: blobs.length,
      blobs: blobs.map(b => ({
        pathname: b.pathname,
        url: b.url,
        uploadedAt: b.uploadedAt,
        size: b.size,
      }))
    });

  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
