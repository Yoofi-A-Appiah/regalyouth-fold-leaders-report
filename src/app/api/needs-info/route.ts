import { NextRequest, NextResponse } from 'next/server';
import { getNeedsInfoList, addNeedsInfo, removeNeedsInfo } from '@/lib/db';

export async function GET() {
  try {
    const data = await getNeedsInfoList();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch needs-info list' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'removeNeedsInfo') {
      const res = await removeNeedsInfo(body);
      return NextResponse.json(res);
    }

    const res = await addNeedsInfo(body);
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Needs-info operation failed' }, { status: 400 });
  }
}
