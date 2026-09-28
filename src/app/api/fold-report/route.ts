import { NextRequest, NextResponse } from 'next/server';
import {
  getRoster,
  getSubmissions,
  getAdminStats,
  getPrayerList,
  getNeedsInfoList,
  getEvents,
  getAttendance,
  addSubmission,
  addLeader,
  addMember,
  assignMember,
  removeMember,
  addPrayerRequest,
  removePrayerRequest,
  addNeedsInfo,
  removeNeedsInfo,
  addEvent,
  deleteEvent,
  markAttendance,
} from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    if (action === 'getRoster') return NextResponse.json(await getRoster());
    if (action === 'getSubmissions') return NextResponse.json(await getSubmissions(searchParams.get('period') || undefined));
    if (action === 'getAdminStats') return NextResponse.json(await getAdminStats());
    if (action === 'getPrayerList') return NextResponse.json(await getPrayerList());
    if (action === 'getNeedsInfoList') return NextResponse.json(await getNeedsInfoList());
    if (action === 'getEvents') return NextResponse.json(await getEvents());
    if (action === 'getAttendance') {
      const eventId = searchParams.get('eventId') || '';
      const leaderId = searchParams.get('leaderId') || undefined;
      return NextResponse.json(await getAttendance(eventId, leaderId));
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let data: any;
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await req.json();
    } else {
      const text = await req.text();
      data = JSON.parse(text);
    }
    const { action } = data;

    if (action === 'addSubmission') return NextResponse.json(await addSubmission(data));
    if (action === 'addLeader') return NextResponse.json(await addLeader(data));
    if (action === 'addMember') return NextResponse.json(await addMember(data));
    if (action === 'assignMember') return NextResponse.json(await assignMember(data));
    if (action === 'removeMember') return NextResponse.json(await removeMember(data));
    if (action === 'addPrayerRequest') return NextResponse.json(await addPrayerRequest(data));
    if (action === 'removePrayerRequest') return NextResponse.json(await removePrayerRequest(data));
    if (action === 'addNeedsInfo') return NextResponse.json(await addNeedsInfo(data));
    if (action === 'removeNeedsInfo') return NextResponse.json(await removeNeedsInfo(data));
    if (action === 'addEvent') return NextResponse.json(await addEvent(data));
    if (action === 'deleteEvent') return NextResponse.json(await deleteEvent(data.eventId));
    if (action === 'markAttendance') return NextResponse.json(await markAttendance(data));

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
