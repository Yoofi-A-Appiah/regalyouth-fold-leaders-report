import { NextRequest, NextResponse } from 'next/server';
import { getEvents, addEvent, deleteEvent } from '@/lib/db';

export async function GET() {
  try {
    const data = await getEvents();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'deleteEvent') {
      const res = await deleteEvent(body.eventId);
      return NextResponse.json(res);
    }

    const res = await addEvent(body);
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Event operation failed' }, { status: 400 });
  }
}
