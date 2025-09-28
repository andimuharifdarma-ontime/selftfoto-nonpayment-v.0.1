import { NextRequest, NextResponse } from 'next/server';
import { getImage, saveImage } from '@/lib/imageStore';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const img = getImage(id);
  if (!img) {
    return new NextResponse('Not found', { status: 404 });
  }
  return new NextResponse(img.data, {
    headers: {
      'Content-Type': img.mime,
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const arrayBuffer = await req.arrayBuffer();
  const data = Buffer.from(arrayBuffer);
  saveImage(id, { data, mime: 'image/png', createdAt: Date.now() });
  return NextResponse.json({ ok: true });
}



