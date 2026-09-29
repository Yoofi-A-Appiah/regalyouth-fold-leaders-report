import { NextRequest, NextResponse } from 'next/server';
import { getAttendance, markAttendance } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId') || undefined;
    const leaderId = searchParams.get('leaderId') || undefined;

    // No eventId -> full attendance history, used by the admin analytics tab.
    const data = await getAttendance(eventId, leaderId);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await markAttendance(body);
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Attendance operation failed' }, { status: 400 });
  }
}
