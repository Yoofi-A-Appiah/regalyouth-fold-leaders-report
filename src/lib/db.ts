"use server"
import { MongoClient, Db } from 'mongodb';
import { Leader, Member, Submission, PrayerRequest, NeedsInfoItem, EventItem, AttendanceRecord, AdminStats, ExecResource } from './types';
import { INITIAL_LEADERS, INITIAL_UNASSIGNED, INITIAL_EVENTS } from './seed-data';
import { currentPeriodKey } from './period';

// In-Memory Fallback Store (active if MONGODB_URI is not set or has placeholders)
class MemoryStore {
  leaders: Leader[] = JSON.parse(JSON.stringify(INITIAL_LEADERS));
  unassigned: Member[] = JSON.parse(JSON.stringify(INITIAL_UNASSIGNED));
  submissions: Submission[] = [];
  prayerList: PrayerRequest[] = [];
  needsInfoList: NeedsInfoItem[] = [];
  events: EventItem[] = JSON.parse(JSON.stringify(INITIAL_EVENTS));
  attendance: AttendanceRecord[] = [];
  resources: ExecResource[] = [];
}

const globalForStore = globalThis as unknown as {
  __rymStore?: MemoryStore;
  __mongoClientPromise?: Promise<MongoClient>;
};

const memStore = globalForStore.__rymStore ?? (globalForStore.__rymStore = new MemoryStore());

function getMongoClientPromise(): Promise<MongoClient> | null {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri || uri.includes('<db_username>') || uri.includes('<db_password>')) {
    return null;
  }

  if (!globalForStore.__mongoClientPromise) {
    const client = new MongoClient(uri);
    globalForStore.__mongoClientPromise = client.connect();
  }
  return globalForStore.__mongoClientPromise;
}

export async function getDb(): Promise<Db | null> {
  const promise = getMongoClientPromise();
  if (!promise) return null;
  try {
    const client = await promise;
    return client.db('regalyouth');
  } catch (err) {
    console.error('MongoDB connection error, falling back to local store:', err);
    return null;
  }
}

// Ensure database is initialized with seed data if empty
let isInitialized = false;
export async function initDb() {
  const db = await getDb();
  if (!db) return { ok: true, mode: 'in-memory' };

  if (isInitialized) return { ok: true, mode: 'mongodb' };

  try {
    const leadersCol = db.collection('leaders');
    const count = await leadersCol.countDocuments();
    if (count === 0) {
      // Seed leaders and their members
      await leadersCol.insertMany(
        INITIAL_LEADERS.map(l => ({
          id: l.id,
          name: l.name,
          addedAt: new Date().toISOString(),
          members: l.members.map(m => ({
            name: m.name,
            phone: m.phone || '',
            leaderId: l.id,
            addedAt: new Date().toISOString(),
          })),
        }))
      );

      // Seed unassigned members
      if (INITIAL_UNASSIGNED.length > 0) {
        await db.collection('unassigned').insertMany(
          INITIAL_UNASSIGNED.map(m => ({
            name: m.name,
            phone: m.phone || '',
            leaderId: '',
            addedAt: new Date().toISOString(),
          }))
        );
      }

      // Seed events
      if (INITIAL_EVENTS.length > 0) {
        await db.collection('events').insertMany(
          INITIAL_EVENTS.map(ev => ({
            id: ev.id,
            name: ev.name,
            type: ev.type,
            date: ev.date,
            createdAt: ev.createdAt,
            createdBy: ev.createdBy || 'admin',
          }))
        );
      }
    }

    isInitialized = true;
    return { ok: true, mode: 'mongodb' };
  } catch (err) {
    console.error('Error initializing MongoDB tables:', err);
    return { ok: true, mode: 'in-memory' };
  }
}

// ──────────────── ROSTER ────────────────
export async function getRoster(): Promise<{ leaders: Leader[]; unassigned: Member[] }> {
  const db = await getDb();
  if (!db) {
    return { leaders: memStore.leaders, unassigned: memStore.unassigned };
  }

  await initDb();
  const [leadersDocs, unassignedDocs] = await Promise.all([
    db.collection('leaders').find({}).sort({ id: 1 }).toArray(),
    db.collection('unassigned').find({}).sort({ name: 1 }).toArray(),
  ]);

  const leaders: Leader[] = leadersDocs.map(doc => ({
    id: doc.id,
    name: doc.name,
    addedAt: doc.addedAt,
    isExecutive: !!doc.isExecutive,
    isSuperAdmin: !!doc.isSuperAdmin,
    isFoldCoordinator: !!doc.isFoldCoordinator,
    members: (doc.members || []).map((m: any) => ({
      name: m.name,
      phone: m.phone || '',
      leaderId: doc.id,
      addedAt: m.addedAt,
    })),
  }));

  const unassigned: Member[] = unassignedDocs.map(doc => ({
    name: doc.name,
    phone: doc.phone || '',
    leaderId: '',
    addedAt: doc.addedAt,
  }));

  return { leaders, unassigned };
}

export async function addLeader(data: { id: string; name: string }): Promise<{ ok: boolean }> {
  const db = await getDb();
  const id = data.id.trim().toUpperCase();
  const name = data.name.trim();

  if (!db) {
    if (memStore.leaders.some(l => l.id.toLowerCase() === id.toLowerCase())) {
      throw new Error('Leader with this ID already exists');
    }
    memStore.leaders.push({ id, name, members: [] });
    return { ok: true };
  }

  await initDb();
  const existing = await db.collection('leaders').findOne({ id });
  if (existing) throw new Error('Leader with this ID already exists');

  await db.collection('leaders').insertOne({
    id,
    name,
    addedAt: new Date().toISOString(),
    members: [],
  });
  return { ok: true };
}

export async function setLeaderExecutive(data: { leaderId: string; isExecutive: boolean }): Promise<{ ok: boolean }> {
  const db = await getDb();
  const leaderId = data.leaderId.trim().toUpperCase();

  if (!db) {
    const leader = memStore.leaders.find(l => l.id === leaderId);
    if (!leader) throw new Error('Leader not found');
    leader.isExecutive = data.isExecutive;
    return { ok: true };
  }

  await initDb();
  const res = await db.collection('leaders').updateOne({ id: leaderId }, { $set: { isExecutive: data.isExecutive } });
  if (res.matchedCount === 0) throw new Error('Leader not found');
  return { ok: true };
}

// Super Admin is set by hand directly in MongoDB (exactly one person, not an app feature):
//   db.leaders.updateOne({ id: "FL-XXX" }, { $set: { isSuperAdmin: true } })
// No endpoint mutates it -- getRoster() below just reads whatever is already there.

export async function setLeaderFoldCoordinator(data: { leaderId: string; isFoldCoordinator: boolean }): Promise<{ ok: boolean }> {
  const db = await getDb();
  const leaderId = data.leaderId.trim().toUpperCase();

  if (!db) {
    const leader = memStore.leaders.find(l => l.id === leaderId);
    if (!leader) throw new Error('Leader not found');
    leader.isFoldCoordinator = data.isFoldCoordinator;
    return { ok: true };
  }

  await initDb();
  const res = await db.collection('leaders').updateOne({ id: leaderId }, { $set: { isFoldCoordinator: data.isFoldCoordinator } });
  if (res.matchedCount === 0) throw new Error('Leader not found');
  return { ok: true };
}

export async function addMember(data: { name: string; phone?: string; leaderId?: string }): Promise<{ ok: boolean }> {
  const db = await getDb();
  const name = data.name.trim();
  const phone = data.phone?.trim() || '';
  const leaderId = data.leaderId?.trim() || '';

  if (!db) {
    if (leaderId) {
      const leader = memStore.leaders.find(l => l.id === leaderId);
      if (leader) {
        if (leader.members.some(m => m.name.toLowerCase() === name.toLowerCase())) {
          throw new Error('Member already exists in this fold');
        }
        leader.members.push({ name, phone, leaderId });
      } else {
        memStore.unassigned.push({ name, phone, leaderId: '' });
      }
    } else {
      memStore.unassigned.push({ name, phone, leaderId: '' });
    }
    return { ok: true };
  }

  await initDb();
  if (leaderId) {
    const leader = await db.collection('leaders').findOne({ id: leaderId });
    if (!leader) throw new Error('Fold leader not found');

    const exists = (leader.members || []).some((m: any) => m.name.toLowerCase() === name.toLowerCase());
    if (exists) throw new Error('Member already exists in this fold');

    await db.collection('leaders').updateOne(
      { id: leaderId },
      { $push: { members: { name, phone, leaderId, addedAt: new Date().toISOString() } } as any }
    );
  } else {
    await db.collection('unassigned').insertOne({
      name,
      phone,
      leaderId: '',
      addedAt: new Date().toISOString(),
    });
  }
  return { ok: true };
}

export async function assignMember(data: { memberName: string; fromLeaderId?: string; toLeaderId?: string }): Promise<{ ok: boolean }> {
  const db = await getDb();
  const memberName = data.memberName.trim();
  const fromLeaderId = data.fromLeaderId?.trim() || '';
  const toLeaderId = data.toLeaderId?.trim() || '';

  if (!db) {
    let foundMember: Member | null = null;
    if (fromLeaderId) {
      const fromLead = memStore.leaders.find(l => l.id === fromLeaderId);
      if (fromLead) {
        const idx = fromLead.members.findIndex(m => m.name.toLowerCase() === memberName.toLowerCase());
        if (idx !== -1) {
          foundMember = fromLead.members.splice(idx, 1)[0];
        }
      }
    } else {
      const idx = memStore.unassigned.findIndex(m => m.name.toLowerCase() === memberName.toLowerCase());
      if (idx !== -1) {
        foundMember = memStore.unassigned.splice(idx, 1)[0];
      }
    }

    if (!foundMember) throw new Error('Member not found');
    foundMember.leaderId = toLeaderId;
    if (toLeaderId) {
      const toLead = memStore.leaders.find(l => l.id === toLeaderId);
      if (toLead) toLead.members.push(foundMember);
      else memStore.unassigned.push(foundMember);
    } else {
      memStore.unassigned.push(foundMember);
    }
    return { ok: true };
  }

  await initDb();
  let memberData: any = null;

  // 1. Remove from source
  if (fromLeaderId) {
    const leader = await db.collection('leaders').findOne({ id: fromLeaderId });
    if (leader) {
      memberData = (leader.members || []).find((m: any) => m.name.toLowerCase() === memberName.toLowerCase());
      await db.collection('leaders').updateOne(
        { id: fromLeaderId },
        { $pull: { members: { name: { $regex: new RegExp(`^${memberName}$`, 'i') } } } } as any
      );
    }
  } else {
    memberData = await db.collection('unassigned').findOne({ name: { $regex: new RegExp(`^${memberName}$`, 'i') } });
    if (memberData) {
      await db.collection('unassigned').deleteOne({ name: { $regex: new RegExp(`^${memberName}$`, 'i') } });
    }
  }

  if (!memberData) throw new Error('Member not found to reassign');

  // 2. Add to destination
  if (toLeaderId) {
    await db.collection('leaders').updateOne(
      { id: toLeaderId },
      {
        $push: {
          members: {
            name: memberData.name,
            phone: memberData.phone || '',
            leaderId: toLeaderId,
            addedAt: memberData.addedAt || new Date().toISOString(),
          },
        },
      } as any
    );
  } else {
    await db.collection('unassigned').insertOne({
      name: memberData.name,
      phone: memberData.phone || '',
      leaderId: '',
      addedAt: memberData.addedAt || new Date().toISOString(),
    });
  }

  return { ok: true };
}

export async function removeMember(data: { memberName: string; leaderId?: string }): Promise<{ ok: boolean }> {
  const db = await getDb();
  const memberName = data.memberName.trim();
  const leaderId = data.leaderId?.trim() || '';

  if (!db) {
    if (leaderId) {
      const lead = memStore.leaders.find(l => l.id === leaderId);
      if (lead) {
        lead.members = lead.members.filter(m => m.name.toLowerCase() !== memberName.toLowerCase());
      }
    } else {
      memStore.unassigned = memStore.unassigned.filter(m => m.name.toLowerCase() !== memberName.toLowerCase());
    }
    return { ok: true };
  }

  await initDb();
  if (leaderId) {
    await db.collection('leaders').updateOne(
      { id: leaderId },
      { $pull: { members: { name: { $regex: new RegExp(`^${memberName}$`, 'i') } } } } as any
    );
  } else {
    await db.collection('unassigned').deleteOne({ name: { $regex: new RegExp(`^${memberName}$`, 'i') } });
  }
  return { ok: true };
}

// ──────────────── SUBMISSIONS ────────────────
export async function getSubmissions(period?: string): Promise<{ submissions: Submission[] }> {
  const db = await getDb();
  if (!db) {
    const filtered = period
      ? memStore.submissions.filter(s => s.period === period)
      : memStore.submissions;
    return { submissions: filtered };
  }

  await initDb();
  const filter: any = {};
  if (period) filter.period = period;

  const docs = await db.collection('submissions').find(filter).sort({ submittedAt: -1 }).toArray();
  const submissions: Submission[] = docs.map(d => ({
    id: d._id.toString() as any,
    submittedAt: d.submittedAt,
    period: d.period,
    leaderId: d.leaderId,
    leaderName: d.leaderName,
    memberId: d.memberId || '',
    memberName: d.memberName,
    memberPhone: d.memberPhone || '',
    date: d.date,
    type: d.type,
    context: d.context || '',
    method: d.method || '',
    response: d.response || '',
    prayerNeeds: d.prayerNeeds || '',
    reason: d.reason || '',
    observations: d.observations || '',
    outcomes: d.outcomes || '',
  }));

  return { submissions };
}

export async function addSubmission(data: any): Promise<{ ok: boolean }> {
  const db = await getDb();
  const type = data.type === 'visitation' ? 'visitation' : 'followup';
  const submittedAt = data.submittedAt || new Date().toISOString();
  const period = data.period || currentPeriodKey();

  const doc = {
    ...data,
    type,
    period,
    submittedAt,
  };

  if (!db) {
    memStore.submissions.unshift({ ...doc, id: Date.now() });
    return { ok: true };
  }

  await initDb();
  await db.collection('submissions').insertOne(doc);
  return { ok: true };
}

// ──────────────── ADMIN STATS ────────────────
export async function getAdminStats(): Promise<AdminStats> {
  const db = await getDb();
  const period = currentPeriodKey();

  if (!db) {
    const totalSubmissions = memStore.submissions.length;
    const thisPeriodSubs = memStore.submissions.filter(s => s.period === period);
    const leaderCounts: Record<string, number> = {};
    thisPeriodSubs.forEach(s => {
      leaderCounts[s.leaderId] = (leaderCounts[s.leaderId] || 0) + 1;
    });
    return {
      totalSubmissions,
      thisPeriodSubmissions: thisPeriodSubs.length,
      leaderCounts,
      recentSubmissions: memStore.submissions.slice(0, 10),
    };
  }

  await initDb();
  const [totalSubmissions, periodDocs, recentDocs] = await Promise.all([
    db.collection('submissions').countDocuments(),
    db.collection('submissions').find({ period }).toArray(),
    db.collection('submissions').find({}).sort({ submittedAt: -1 }).limit(10).toArray(),
  ]);

  const leaderCounts: Record<string, number> = {};
  periodDocs.forEach(d => {
    leaderCounts[d.leaderId] = (leaderCounts[d.leaderId] || 0) + 1;
  });

  const recentSubmissions: Submission[] = recentDocs.map(d => ({
    id: d._id.toString() as any,
    submittedAt: d.submittedAt,
    period: d.period,
    leaderId: d.leaderId,
    leaderName: d.leaderName,
    memberId: d.memberId || '',
    memberName: d.memberName,
    memberPhone: d.memberPhone || '',
    date: d.date,
    type: d.type,
    context: d.context || '',
    method: d.method || '',
    response: d.response || '',
    prayerNeeds: d.prayerNeeds || '',
    reason: d.reason || '',
    observations: d.observations || '',
    outcomes: d.outcomes || '',
  }));

  return {
    totalSubmissions,
    thisPeriodSubmissions: periodDocs.length,
    leaderCounts,
    recentSubmissions,
  };
}

// ──────────────── PRAYER LIST ────────────────
export async function getPrayerList(): Promise<{ prayerList: PrayerRequest[] }> {
  const db = await getDb();
  if (!db) {
    return { prayerList: memStore.prayerList.filter(p => p.active !== false && p.active !== 'false') };
  }

  await initDb();
  const docs = await db.collection('prayerList').find({ active: { $ne: false } }).sort({ addedAt: -1 }).toArray();
  const prayerList: PrayerRequest[] = docs.map(d => ({
    id: d._id.toString() as any,
    addedAt: d.addedAt,
    leaderId: d.leaderId,
    leaderName: d.leaderName,
    memberName: d.memberName,
    memberPhone: d.memberPhone || '',
    reason: d.reason || '',
    active: d.active,
  }));
  return { prayerList };
}

export async function addPrayerRequest(data: any): Promise<{ ok: boolean }> {
  const db = await getDb();
  const addedAt = data.addedAt || new Date().toISOString();

  if (!db) {
    memStore.prayerList = memStore.prayerList.filter(
      item => !(item.leaderId === data.leaderId && item.memberName.toLowerCase() === data.memberName.toLowerCase())
    );
    memStore.prayerList.unshift({
      id: Date.now(),
      addedAt,
      leaderId: data.leaderId,
      leaderName: data.leaderName,
      memberName: data.memberName,
      memberPhone: data.memberPhone || '',
      reason: data.reason || '',
      active: true,
    });
    return { ok: true };
  }

  await initDb();
  await db.collection('prayerList').deleteMany({
    leaderId: data.leaderId,
    memberName: { $regex: new RegExp(`^${data.memberName}$`, 'i') },
  });

  await db.collection('prayerList').insertOne({
    addedAt,
    leaderId: data.leaderId,
    leaderName: data.leaderName,
    memberName: data.memberName,
    memberPhone: data.memberPhone || '',
    reason: data.reason || '',
    active: true,
  });
  return { ok: true };
}

export async function removePrayerRequest(data: { leaderId: string; memberName: string }): Promise<{ ok: boolean }> {
  const db = await getDb();
  if (!db) {
    memStore.prayerList = memStore.prayerList.filter(
      item => !(item.leaderId === data.leaderId && item.memberName.toLowerCase() === data.memberName.toLowerCase())
    );
    return { ok: true };
  }

  await initDb();
  await db.collection('prayerList').deleteMany({
    leaderId: data.leaderId,
    memberName: { $regex: new RegExp(`^${data.memberName}$`, 'i') },
  });
  return { ok: true };
}

// ──────────────── NEEDS INFO LIST ────────────────
export async function getNeedsInfoList(): Promise<{ needsInfoList: NeedsInfoItem[] }> {
  const db = await getDb();
  if (!db) {
    return { needsInfoList: memStore.needsInfoList.filter(n => n.active !== false && n.active !== 'false') };
  }

  await initDb();
  const docs = await db.collection('needsInfoList').find({ active: { $ne: false } }).sort({ addedAt: -1 }).toArray();
  const needsInfoList: NeedsInfoItem[] = docs.map(d => ({
    id: d._id.toString() as any,
    addedAt: d.addedAt,
    leaderId: d.leaderId,
    leaderName: d.leaderName,
    memberName: d.memberName,
    memberPhone: d.memberPhone || '',
    reason: d.reason || '',
    active: d.active,
  }));
  return { needsInfoList };
}

export async function addNeedsInfo(data: any): Promise<{ ok: boolean }> {
  const db = await getDb();
  const addedAt = data.addedAt || new Date().toISOString();

  if (!db) {
    memStore.needsInfoList = memStore.needsInfoList.filter(
      item => !(item.leaderId === data.leaderId && item.memberName.toLowerCase() === data.memberName.toLowerCase())
    );
    memStore.needsInfoList.unshift({
      id: Date.now(),
      addedAt,
      leaderId: data.leaderId,
      leaderName: data.leaderName,
      memberName: data.memberName,
      memberPhone: data.memberPhone || '',
      reason: data.reason || '',
      active: true,
    });
    return { ok: true };
  }

  await initDb();
  await db.collection('needsInfoList').deleteMany({
    leaderId: data.leaderId,
    memberName: { $regex: new RegExp(`^${data.memberName}$`, 'i') },
  });

  await db.collection('needsInfoList').insertOne({
    addedAt,
    leaderId: data.leaderId,
    leaderName: data.leaderName,
    memberName: data.memberName,
    memberPhone: data.memberPhone || '',
    reason: data.reason || '',
    active: true,
  });
  return { ok: true };
}

export async function removeNeedsInfo(data: { leaderId: string; memberName: string }): Promise<{ ok: boolean }> {
  const db = await getDb();
  if (!db) {
    memStore.needsInfoList = memStore.needsInfoList.filter(
      item => !(item.leaderId === data.leaderId && item.memberName.toLowerCase() === data.memberName.toLowerCase())
    );
    return { ok: true };
  }

  await initDb();
  await db.collection('needsInfoList').deleteMany({
    leaderId: data.leaderId,
    memberName: { $regex: new RegExp(`^${data.memberName}$`, 'i') },
  });
  return { ok: true };
}

// ──────────────── EVENTS ────────────────
export async function getEvents(): Promise<{ events: EventItem[] }> {
  const db = await getDb();
  if (!db) {
    return { events: memStore.events };
  }

  await initDb();
  const docs = await db.collection('events').find({}).sort({ date: -1 }).toArray();
  const events: EventItem[] = docs.map(d => ({
    id: d.id,
    name: d.name,
    type: d.type || 'OT',
    date: d.date,
    createdAt: d.createdAt,
    createdBy: d.createdBy || 'admin',
  }));
  return { events };
}

export async function addEvent(data: { id?: string; name: string; type?: string; date: string; createdBy?: string }): Promise<{ ok: boolean }> {
  const db = await getDb();
  const id = data.id || `ev-${Date.now()}`;
  const createdAt = new Date().toISOString();

  const doc: EventItem = {
    id,
    name: data.name,
    type: data.type || 'OT',
    date: data.date,
    createdAt,
    createdBy: data.createdBy || 'admin',
  };

  if (!db) {
    memStore.events.unshift(doc);
    return { ok: true };
  }

  await initDb();
  await db.collection('events').insertOne(doc);
  return { ok: true };
}

export async function deleteEvent(eventId: string): Promise<{ ok: boolean }> {
  const db = await getDb();
  if (!db) {
    memStore.events = memStore.events.filter(e => e.id !== eventId);
    return { ok: true };
  }

  await initDb();
  await db.collection('events').deleteOne({ id: eventId });
  return { ok: true };
}

// ──────────────── ATTENDANCE ────────────────
export async function getAttendance(eventId?: string, leaderId?: string): Promise<{ attendance: AttendanceRecord[] }> {
  const db = await getDb();
  if (!db) {
    const filtered = memStore.attendance.filter(
      a => (!eventId || a.eventId === eventId) && (!leaderId || a.leaderId === leaderId)
    );
    return { attendance: filtered };
  }

  await initDb();
  const filter: any = {};
  if (eventId) filter.eventId = eventId;
  if (leaderId) filter.leaderId = leaderId;

  const docs = await db.collection('attendance').find(filter).toArray();
  const attendance: AttendanceRecord[] = docs.map(d => ({
    id: d._id.toString() as any,
    markedAt: d.markedAt,
    eventId: d.eventId,
    eventName: d.eventName,
    leaderId: d.leaderId,
    leaderName: d.leaderName,
    memberName: d.memberName,
    present: d.present,
    isLeader: !!d.isLeader,
  }));
  return { attendance };
}

export async function markAttendance(data: {
  eventId: string;
  eventName: string;
  leaderId: string;
  leaderName: string;
  attendance: { memberName: string; present: boolean; isLeader?: boolean }[];
  markedAt?: string;
}): Promise<{ ok: boolean }> {
  const db = await getDb();
  const markedAt = data.markedAt || new Date().toISOString();

  if (!db) {
    memStore.attendance = memStore.attendance.filter(
      a => !(a.eventId === data.eventId && a.leaderId === data.leaderId)
    );
    data.attendance.forEach(item => {
      memStore.attendance.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        markedAt,
        eventId: data.eventId,
        eventName: data.eventName,
        leaderId: data.leaderId,
        leaderName: data.leaderName,
        memberName: item.memberName,
        present: item.present,
        isLeader: !!item.isLeader,
      });
    });
    return { ok: true };
  }

  await initDb();
  // Clear existing attendance for this event & fold
  await db.collection('attendance').deleteMany({
    eventId: data.eventId,
    leaderId: data.leaderId,
  });

  if (data.attendance && data.attendance.length > 0) {
    await db.collection('attendance').insertMany(
      data.attendance.map(item => ({
        markedAt,
        eventId: data.eventId,
        eventName: data.eventName,
        leaderId: data.leaderId,
        leaderName: data.leaderName,
        memberName: item.memberName,
        present: item.present,
        isLeader: !!item.isLeader,
      }))
    );
  }
  return { ok: true };
}

// ──────────────── YOUTH EXECUTIVE RESOURCES ────────────────
export async function getResources(): Promise<{ resources: ExecResource[] }> {
  const db = await getDb();
  if (!db) {
    return { resources: memStore.resources };
  }

  await initDb();
  const docs = await db.collection('resources').find({}).sort({ addedAt: -1 }).toArray();
  const resources: ExecResource[] = docs.map(d => ({
    id: d.id,
    title: d.title,
    url: d.url,
    kind: d.kind || 'other',
    addedAt: d.addedAt,
  }));
  return { resources };
}

export async function addResource(data: { title: string; url: string; kind?: string }): Promise<{ ok: boolean }> {
  const db = await getDb();
  const id = `res-${Date.now()}`;
  const kind: ExecResource['kind'] =
    data.kind === 'doc' || data.kind === 'sheet' ? data.kind : /spreadsheets/.test(data.url) ? 'sheet' : /docs\.google\.com\/document/.test(data.url) ? 'doc' : 'other';

  const doc: ExecResource = {
    id,
    title: data.title.trim(),
    url: data.url.trim(),
    kind,
    addedAt: new Date().toISOString(),
  };

  if (!db) {
    memStore.resources.unshift(doc);
    return { ok: true };
  }

  await initDb();
  await db.collection('resources').insertOne(doc);
  return { ok: true };
}

export async function deleteResource(id: string): Promise<{ ok: boolean }> {
  const db = await getDb();
  if (!db) {
    memStore.resources = memStore.resources.filter(r => r.id !== id);
    return { ok: true };
  }

  await initDb();
  await db.collection('resources').deleteOne({ id });
  return { ok: true };
}
