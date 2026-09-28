import { NextRequest, NextResponse } from 'next/server';
import { getPrayerList, addPrayerRequest, removePrayerRequest } from '@/lib/db';

export async function GET() {
  try {
    const data = await getPrayerList();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch prayer list' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'removePrayerRequest') {
      const res = await removePrayerRequest(body);
      return NextResponse.json(res);
    }

    const res = await addPrayerRequest(body);
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Prayer request operation failed' }, { status: 400 });
  }
}
