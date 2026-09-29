import { NextRequest, NextResponse } from 'next/server';
import { getResources, addResource, deleteResource } from '@/lib/db';

export async function GET() {
  try {
    const data = await getResources();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch resources' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'deleteResource') {
      const res = await deleteResource(body.id);
      return NextResponse.json(res);
    }

    const res = await addResource(body);
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Resource operation failed' }, { status: 400 });
  }
}
