import { NextRequest, NextResponse } from 'next/server';
import { getRoster, addLeader, addMember, assignMember, removeMember, setLeaderExecutive, setLeaderFoldCoordinator } from '@/lib/db';

export async function GET() {
  try {
    const data = await getRoster();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch roster' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'addLeader') {
      const res = await addLeader(body);
      return NextResponse.json(res);
    }
    if (action === 'addMember') {
      const res = await addMember(body);
      return NextResponse.json(res);
    }
    if (action === 'assignMember') {
      const res = await assignMember(body);
      return NextResponse.json(res);
    }
    if (action === 'removeMember') {
      const res = await removeMember(body);
      return NextResponse.json(res);
    }
    if (action === 'setExecutive') {
      const res = await setLeaderExecutive(body);
      return NextResponse.json(res);
    }
    if (action === 'setFoldCoordinator') {
      const res = await setLeaderFoldCoordinator(body);
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Operation failed' }, { status: 400 });
  }
}
