'use client';

import React, { useState } from 'react';
import {
  Leader,
  Member,
  Submission,
  PrayerRequest,
  NeedsInfoItem,
  EventItem,
  AdminStats,
} from '@/lib/types';
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Users,
  Flame,
  HelpCircle,
  FileText,
  ClipboardList,
  Shuffle,
  Database,
  Plus,
  Trash2,
  Printer,
  Search,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AdminPortalProps {
  stats: AdminStats | null;
  leaders: Leader[];
  unassigned: Member[];
  events: EventItem[];
  submissions: Submission[];
  prayerList: PrayerRequest[];
  needsInfoList: NeedsInfoItem[];
  neonMode: 'neon' | 'in-memory' | 'checking';
  onAddLeader: (payload: { id: string; name: string }) => Promise<void>;
  onAddMember: (payload: { name: string; phone?: string; leaderId?: string }) => Promise<void>;
  onAssignMember: (payload: { memberName: string; fromLeaderId?: string; toLeaderId?: string }) => Promise<void>;
  onRemoveMember: (payload: { memberName: string; leaderId?: string }) => Promise<void>;
  onAddEvent: (payload: { name: string; type?: string; date: string }) => Promise<void>;
  onDeleteEvent: (eventId: string) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  stats,
  leaders,
  unassigned,
  events,
  submissions,
  prayerList,
  needsInfoList,
  neonMode,
  onAddLeader,
  onAddMember,
  onAssignMember,
  onRemoveMember,
  onAddEvent,
  onDeleteEvent,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'events'
    | 'performance'
    | 'members'
    | 'prayer'
    | 'needsinfo'
    | 'submissions'
    | 'random'
    | 'database'
  >('overview');

  // Form states
  const [newLeaderName, setNewLeaderName] = useState('');
  const [newLeaderId, setNewLeaderId] = useState('');

  const [newEventName, setNewEventName] = useState('');
  const [newEventType, setNewEventType] = useState('YM');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberLeader, setNewMemberLeader] = useState(leaders[0]?.id || '');

  const [memberSearch, setMemberSearch] = useState('');

  // Performance Tab Period Filter
  const [selectedPerfPeriod, setSelectedPerfPeriod] = useState<string>('ALL');

  // Submissions Log Filter
  const [subTypeFilter, setSubTypeFilter] = useState<'all' | 'followup' | 'visitation'>('all');
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null);

  // Random Picker State
  const [randomIncludeLeaders, setRandomIncludeLeaders] = useState(false);
  const [randomResult, setRandomResult] = useState<{ name: string; role: string; fold: string } | null>(null);
  const [randomHistory, setRandomHistory] = useState<{ name: string; role: string; fold: string; time: string }[]>([]);
  const [isPicking, setIsPicking] = useState(false);

  // Total youth across all folds + unassigned
  const allMembersList: { member: Member; leaderName: string; leaderId: string }[] = [];
  leaders.forEach(l => {
    (l.members || []).forEach(m => {
      allMembersList.push({ member: m, leaderName: l.name, leaderId: l.id });
    });
  });
  unassigned.forEach(m => {
    allMembersList.push({ member: m, leaderName: 'Unassigned', leaderId: '' });
  });

  // Calculate unique periods in submissions
  const submissionPeriods = Array.from(new Set(submissions.map(s => s.period))).filter(Boolean);

  // Handle Add Leader
  const handleAddLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaderName.trim() || !newLeaderId.trim()) return;
    await onAddLeader({ id: newLeaderId.trim().toUpperCase(), name: newLeaderName.trim() });
    setNewLeaderName('');
    setNewLeaderId('');
  };

  // Handle Add Event
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim()) return;
    await onAddEvent({
      name: newEventName.trim(),
      type: newEventType,
      date: newEventDate,
    });
    setNewEventName('');
  };

  // Handle Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    await onAddMember({
      name: newMemberName.trim(),
      phone: newMemberPhone.trim(),
      leaderId: newMemberLeader || undefined,
    });
    setNewMemberName('');
    setNewMemberPhone('');
  };

  // Random Picker Logic
  const handlePickRandom = () => {
    setIsPicking(true);
    const pool: { name: string; role: string; fold: string }[] = [];

    // Add members
    allMembersList.forEach(item => {
      pool.push({
        name: item.member.name,
        role: 'Youth Member',
        fold: item.leaderName,
      });
    });

    // Optionally add leaders
    if (randomIncludeLeaders) {
      leaders.forEach(l => {
        pool.push({
          name: l.name,
          role: 'Fold Leader',
          fold: `${l.name} (${l.id})`,
        });
      });
    }

    if (pool.length === 0) {
      setIsPicking(false);
      return;
    }

    // Animation spin effect
    let count = 0;
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * pool.length);
      setRandomResult(pool[idx]);
      count++;
      if (count > 15) {
        clearInterval(interval);
        const finalPick = pool[Math.floor(Math.random() * pool.length)];
        setRandomResult(finalPick);
        setRandomHistory(prev => [
          { ...finalPick, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          ...prev.slice(0, 19),
        ]);
        setIsPicking(false);
      }
    }, 80);
  };

  // Filtered members for directory
  const filteredMembersList = allMembersList.filter(
    item =>
      item.member.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      item.member.phone.includes(memberSearch) ||
      item.leaderName.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Admin Portal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5 no-print">
        <div>
          <span className="badge badge-gold mb-1">Central Administration</span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--deep)]">
            Ministry Command Center
          </h2>
          <p className="text-xs text-[var(--muted)]">
            Manage fold leaders, membership directory, church events, and follow-up analytics
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="btn-secondary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Printer className="w-4 h-4 text-[var(--gold)]" />
          <span>Print Performance Report</span>
        </button>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex border-b border-[var(--border)] bg-[#FAF5EB] rounded-xl p-1 gap-1 overflow-x-auto no-print">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'events', label: 'Events', icon: Calendar },
          { id: 'performance', label: 'Leader Performance', icon: BarChart3 },
          { id: 'members', label: 'Members Directory', icon: Users },
          { id: 'prayer', label: 'Prayer Wall', icon: Flame },
          { id: 'needsinfo', label: 'Needs Info', icon: HelpCircle },
          { id: 'submissions', label: 'Submissions Audit', icon: FileText },
          { id: 'random', label: 'Random Picker', icon: Shuffle },
          { id: 'database', label: 'Neon Database', icon: Database },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[var(--deep)] text-[var(--gold-light)] shadow-sm'
                  : 'text-[var(--text2)] hover:bg-[var(--gold-pale)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="regal-card p-5 bg-gradient-to-br from-[#FFFDF9] to-[#FAF5EC]">
              <div className="text-xs text-[var(--muted)] font-medium">Total Submissions</div>
              <div className="font-serif text-3xl font-bold text-[var(--deep)] mt-1">
                {stats?.totalSubmissions ?? submissions.length}
              </div>
              <div className="text-[11px] text-[var(--gold)] font-medium mt-1">
                Lifetime reports recorded
              </div>
            </div>

            <div className="regal-card p-5 bg-gradient-to-br from-[#FFFDF9] to-[#FAF5EC]">
              <div className="text-xs text-[var(--muted)] font-medium">This Period Submissions</div>
              <div className="font-serif text-3xl font-bold text-[var(--success)] mt-1">
                {stats?.thisPeriodSubmissions ?? 0}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">
                Active reporting cycle
              </div>
            </div>

            <div className="regal-card p-5 bg-gradient-to-br from-[#FFFDF9] to-[#FAF5EC]">
              <div className="text-xs text-[var(--muted)] font-medium">Fold Leaders</div>
              <div className="font-serif text-3xl font-bold text-[var(--deep)] mt-1">
                {leaders.length}
              </div>
              <div className="text-[11px] text-[var(--muted)] font-medium mt-1">
                Active shepherds
              </div>
            </div>

            <div className="regal-card p-5 bg-gradient-to-br from-[#FFFDF9] to-[#FAF5EC]">
              <div className="text-xs text-[var(--muted)] font-medium">Tracked Youth</div>
              <div className="font-serif text-3xl font-bold text-[var(--deep)] mt-1">
                {allMembersList.length}
              </div>
              <div className="text-[11px] text-[var(--muted)] font-medium mt-1">
                {unassigned.length} unassigned
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add Leader Form */}
            <div className="regal-card p-5 lg:col-span-1 space-y-4">
              <h3 className="font-serif text-base font-bold text-[var(--deep)] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[var(--gold)]" />
                Add New Fold Leader
              </h3>
              <form onSubmit={handleAddLeader} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--deep)] mb-1">
                    Leader ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FL-019"
                    value={newLeaderId}
                    onChange={e => setNewLeaderId(e.target.value)}
                    className="regal-input text-xs uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--deep)] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Grace Mensah"
                    value={newLeaderName}
                    onChange={e => setNewLeaderName(e.target.value)}
                    className="regal-input text-xs"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn-gold w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Leader</span>
                </button>
              </form>
            </div>

            {/* Fold Leaders Roster */}
            <div className="regal-card p-5 lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-bold text-[var(--deep)]">
                  Fold Leaders Directory ({leaders.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {leaders.map(l => (
                  <div
                    key={l.id}
                    className="p-3 rounded-xl border border-[var(--border-light)] bg-[#FFFDF9] flex items-center justify-between gap-3 hover:border-[var(--gold)] transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--bg2)] text-[var(--deep)]">
                          {l.id}
                        </span>
                        <span className="font-semibold text-xs text-[var(--deep)]">
                          {l.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--muted)] mt-1">
                        Fold size: <strong className="text-[var(--deep)]">{l.members.length}</strong> youth
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: EVENTS ── */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Event Form */}
          <div className="regal-card p-5 lg:col-span-1 space-y-4">
            <h3 className="font-serif text-base font-bold text-[var(--deep)] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[var(--gold)]" />
              Create Ministry Event
            </h3>
            <form onSubmit={handleAddEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--deep)] mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Youth Encounter Night"
                  value={newEventName}
                  onChange={e => setNewEventName(e.target.value)}
                  className="regal-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--deep)] mb-1">
                  Event Type
                </label>
                <select
                  value={newEventType}
                  onChange={e => setNewEventType(e.target.value)}
                  className="regal-input text-xs"
                >
                  <option value="YM">YM (Youth Meeting)</option>
                  <option value="OT">OT (Outreach & Training)</option>
                  <option value="Sunday">Sunday Service</option>
                  <option value="Midweek">Midweek Service</option>
                  <option value="Special">Special Conference</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--deep)] mb-1">
                  Event Date
                </label>
                <input
                  type="date"
                  value={newEventDate}
                  onChange={e => setNewEventDate(e.target.value)}
                  className="regal-input text-xs"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-gold w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Publish Event</span>
              </button>
            </form>
          </div>

          {/* Events List */}
          <div className="regal-card p-5 lg:col-span-2 space-y-4">
            <h3 className="font-serif text-base font-bold text-[var(--deep)]">
              Scheduled Ministry Events ({events.length})
            </h3>

            <div className="divide-y divide-[var(--border-light)]">
              {events.map(ev => (
                <div key={ev.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-gold text-[10px]">
                        {ev.type}
                      </span>
                      <span className="font-semibold text-sm text-[var(--deep)]">
                        {ev.name}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--muted)] mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[var(--gold)]" />
                      <span>{new Date(ev.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteEvent(ev.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {events.length === 0 && (
                <p className="text-xs text-center text-[var(--muted)] py-8">
                  No events currently scheduled. Create one above!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: LEADER PERFORMANCE ── */}
      {activeTab === 'performance' && (
        <div className="regal-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-[var(--deep)]">
                Fold Leader Submission Performance
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Track follow-up coverage and home visitation rates per fold
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-[var(--deep)]">Period:</label>
              <select
                value={selectedPerfPeriod}
                onChange={e => setSelectedPerfPeriod(e.target.value)}
                className="regal-input text-xs py-1.5 w-36"
              >
                <option value="ALL">All Periods</option>
                {submissionPeriods.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Performance Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[#FAF5EB] text-[var(--deep)]">
                  <th className="p-3 font-semibold">Leader</th>
                  <th className="p-3 font-semibold">Fold Size</th>
                  <th className="p-3 font-semibold">Follow-Ups</th>
                  <th className="p-3 font-semibold">Visitations</th>
                  <th className="p-3 font-semibold">Total Submissions</th>
                  <th className="p-3 font-semibold">Completion Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {leaders.map(leader => {
                  const foldSize = leader.members.length;
                  const relevantSubs = submissions.filter(
                    s =>
                      s.leaderId === leader.id &&
                      (selectedPerfPeriod === 'ALL' || s.period === selectedPerfPeriod)
                  );

                  const fuCount = relevantSubs.filter(s => s.type === 'followup').length;
                  const visCount = relevantSubs.filter(s => s.type === 'visitation').length;
                  const total = fuCount + visCount;

                  const reportedMemberNames = new Set(
                    relevantSubs.map(s => s.memberName.trim().toLowerCase())
                  );
                  const uniqueCount = leader.members.filter(m =>
                    reportedMemberNames.has(m.name.trim().toLowerCase())
                  ).length;

                  const rate = foldSize > 0 ? Math.round((uniqueCount / foldSize) * 100) : 0;

                  return (
                    <tr key={leader.id} className="hover:bg-[var(--gold-pale)]/40 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-[var(--deep)]">{leader.name}</div>
                        <div className="font-mono text-[10px] text-[var(--muted)]">{leader.id}</div>
                      </td>
                      <td className="p-3 font-medium">{foldSize}</td>
                      <td className="p-3 font-medium text-emerald-800">{fuCount}</td>
                      <td className="p-3 font-medium text-amber-800">{visCount}</td>
                      <td className="p-3 font-bold">{total}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-stone-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[var(--gold)] to-[var(--success)] rounded-full"
                              style={{ width: `${Math.min(100, rate)}%` }}
                            />
                          </div>
                          <span className="font-semibold">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: MEMBERS DIRECTORY ── */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          {/* Add Member Card */}
          <div className="regal-card p-5 space-y-4">
            <h3 className="font-serif text-base font-bold text-[var(--deep)] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[var(--gold)]" />
              Add Youth Member to Fold
            </h3>
            <form onSubmit={handleAddMember} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--deep)] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Samuel Osei"
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  className="regal-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--deep)] mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 0551234567"
                  value={newMemberPhone}
                  onChange={e => setNewMemberPhone(e.target.value)}
                  className="regal-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--deep)] mb-1">
                  Assign to Fold
                </label>
                <select
                  value={newMemberLeader}
                  onChange={e => setNewMemberLeader(e.target.value)}
                  className="regal-input text-xs"
                >
                  <option value="">-- Unassigned --</option>
                  {leaders.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="btn-gold w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              </div>
            </form>
          </div>

          {/* Members Search & Table */}
          <div className="regal-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-serif text-base font-bold text-[var(--deep)]">
                Youth Directory ({filteredMembersList.length})
              </h3>
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[var(--muted)]" />
                <input
                  type="text"
                  placeholder="Search name, phone, or fold..."
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  className="regal-input pl-8 py-2 text-xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 bg-[#FAF5EB] border-b border-[var(--border)]">
                  <tr>
                    <th className="p-3 font-semibold">Member Name</th>
                    <th className="p-3 font-semibold">Phone</th>
                    <th className="p-3 font-semibold">Assigned Fold</th>
                    <th className="p-3 font-semibold">Reassign Fold</th>
                    <th className="p-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-light)]">
                  {filteredMembersList.map(item => (
                    <tr key={`${item.leaderId}-${item.member.name}`} className="hover:bg-[var(--gold-pale)]/30">
                      <td className="p-3 font-semibold text-[var(--deep)]">
                        {item.member.name}
                      </td>
                      <td className="p-3 text-[var(--muted)] font-mono">
                        {item.member.phone || '—'}
                      </td>
                      <td className="p-3">
                        <span className={`badge ${item.leaderId ? 'badge-gold' : 'badge-pending'}`}>
                          {item.leaderName}
                        </span>
                      </td>
                      <td className="p-3">
                        <select
                          value={item.leaderId}
                          onChange={e => {
                            onAssignMember({
                              memberName: item.member.name,
                              fromLeaderId: item.leaderId,
                              toLeaderId: e.target.value,
                            });
                          }}
                          className="regal-input py-1 text-xs w-44"
                        >
                          <option value="">Unassigned</option>
                          {leaders.map(l => (
                            <option key={l.id} value={l.id}>
                              {l.name} ({l.id})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => onRemoveMember({ memberName: item.member.name, leaderId: item.leaderId })}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: PRAYER WALL ── */}
      {activeTab === 'prayer' && (
        <div className="regal-card p-6 space-y-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-purple-950 flex items-center gap-2">
              <Flame className="w-5 h-5 text-purple-600" />
              Active Ministry Prayer Requests ({prayerList.length})
            </h3>
            <p className="text-xs text-[var(--muted)]">
              All prayer requests flagged by fold leaders for pastoral intercession
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prayerList.map(req => (
              <div
                key={req.id || `${req.leaderId}-${req.memberName}`}
                className="p-4 rounded-xl border border-purple-200 bg-purple-50/60 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-purple-950">
                    {req.memberName}
                  </span>
                  <span className="text-[11px] text-purple-700">
                    {req.addedAt ? new Date(req.addedAt).toLocaleDateString('en-GB') : ''}
                  </span>
                </div>
                <p className="text-xs text-purple-900 bg-white/80 p-3 rounded-lg border border-purple-100">
                  "{req.reason}"
                </p>
                <div className="text-[11px] text-purple-800 flex items-center justify-between">
                  <span>Fold: <strong>{req.leaderName}</strong></span>
                  {req.memberPhone && <span className="font-mono">{req.memberPhone}</span>}
                </div>
              </div>
            ))}

            {prayerList.length === 0 && (
              <p className="col-span-full text-center text-xs text-[var(--muted)] py-12">
                No active prayer requests currently on file. Praise God!
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 6: NEEDS INFO ── */}
      {activeTab === 'needsinfo' && (
        <div className="regal-card p-6 space-y-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-amber-950 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-600" />
              Members Flagged For Information Update ({needsInfoList.length})
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Youth whose contact info, address, or details need updating
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {needsInfoList.map(item => (
              <div
                key={item.id || `${item.leaderId}-${item.memberName}`}
                className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-amber-950">
                    {item.memberName}
                  </span>
                  <span className="text-[11px] text-amber-700">
                    {item.addedAt ? new Date(item.addedAt).toLocaleDateString('en-GB') : ''}
                  </span>
                </div>
                <p className="text-xs text-amber-900 bg-white/80 p-3 rounded-lg border border-amber-100">
                  "{item.reason}"
                </p>
                <div className="text-[11px] text-amber-800 flex items-center justify-between">
                  <span>Fold: <strong>{item.leaderName}</strong></span>
                  {item.memberPhone && <span className="font-mono">{item.memberPhone}</span>}
                </div>
              </div>
            ))}

            {needsInfoList.length === 0 && (
              <p className="col-span-full text-center text-xs text-[var(--muted)] py-12">
                All member information is complete and up to date!
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 7: SUBMISSIONS AUDIT ── */}
      {activeTab === 'submissions' && (
        <div className="regal-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-[var(--deep)]">
                Master Submissions Log ({submissions.length})
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Complete historical record of all follow-up contacts and home visits
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSubTypeFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                  subTypeFilter === 'all' ? 'bg-[var(--deep)] text-white' : 'btn-secondary'
                }`}
              >
                All ({submissions.length})
              </button>
              <button
                onClick={() => setSubTypeFilter('followup')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                  subTypeFilter === 'followup' ? 'bg-emerald-800 text-white' : 'btn-secondary'
                }`}
              >
                Follow-Up
              </button>
              <button
                onClick={() => setSubTypeFilter('visitation')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                  subTypeFilter === 'visitation' ? 'bg-amber-800 text-white' : 'btn-secondary'
                }`}
              >
                Visitation
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {submissions
              .filter(s => subTypeFilter === 'all' || s.type === subTypeFilter)
              .map((sub, idx) => (
                <div
                  key={sub.id || idx}
                  className="p-4 rounded-xl border border-[var(--border-light)] bg-[#FFFDF9] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`badge ${sub.type === 'visitation' ? 'bg-amber-100 text-amber-900' : 'badge-done'}`}>
                        {sub.type === 'visitation' ? 'Visitation' : 'Follow-Up'}
                      </span>
                      <span className="font-semibold text-sm text-[var(--deep)]">
                        {sub.memberName}
                      </span>
                      <span className="text-[11px] text-[var(--muted)] font-mono">
                        Fold: {sub.leaderName}
                      </span>
                    </div>

                    <div className="text-[11px] text-[var(--muted)]">
                      Period <strong className="text-[var(--deep)]">{sub.period}</strong> • {sub.date || new Date(sub.submittedAt).toLocaleDateString('en-GB')}
                    </div>
                  </div>

                  {sub.type === 'followup' ? (
                    <div>
                      <p className="text-[var(--text2)]">
                        <strong>Method:</strong> {sub.method} ({sub.context})
                      </p>
                      {sub.response && (
                        <p className="text-[var(--text2)] bg-[var(--gold-pale)]/50 p-2.5 rounded-lg border border-[var(--border-light)] mt-1">
                          "{sub.response}"
                        </p>
                      )}
                      {sub.prayerNeeds && (
                        <p className="text-purple-900 mt-1">
                          <strong>Prayer Needs:</strong> {sub.prayerNeeds}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-[var(--text2)]">
                        <strong>Reason:</strong> {sub.reason}
                      </p>
                      {sub.observations && (
                        <p className="text-[var(--text2)] bg-[var(--gold-pale)]/50 p-2.5 rounded-lg border border-[var(--border-light)] mt-1">
                          <strong>Observations:</strong> {sub.observations}
                        </p>
                      )}
                      {sub.outcomes && (
                        <p className="text-[var(--text2)] mt-1">
                          <strong>Outcomes:</strong> {sub.outcomes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}

            {submissions.length === 0 && (
              <p className="text-center text-xs text-[var(--muted)] py-12">
                No submissions recorded yet.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 8: RANDOM PICKER ── */}
      {activeTab === 'random' && (
        <div className="regal-card p-6 sm:p-8 text-center space-y-6 max-w-xl mx-auto">
          <div>
            <div className="w-14 h-14 rounded-full bg-[var(--gold-pale)] border-2 border-[var(--gold)] flex items-center justify-center mx-auto mb-3">
              <Shuffle className="w-7 h-7 text-[#8A6800]" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-[var(--deep)]">
              Random Youth Picker
            </h3>
            <p className="text-xs text-[var(--muted)]">
              For icebreakers, youth games, Bible quizzes, and giveaways!
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              id="include-lead"
              checked={randomIncludeLeaders}
              onChange={e => setRandomIncludeLeaders(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="include-lead" className="cursor-pointer">
              Include Fold Leaders in pick pool
            </label>
          </div>

          {/* Random Result Spotlight */}
          <div className="p-8 rounded-2xl bg-gradient-to-br from-[#1A1208] to-[#2C1F0A] text-white shadow-xl min-h-[140px] flex flex-col items-center justify-center">
            {randomResult ? (
              <div className="animate-fade-in space-y-1">
                <div className="text-[var(--gold-light)] text-xs uppercase tracking-wider font-semibold">
                  Selected Youth
                </div>
                <div className="font-serif text-2xl sm:text-3xl font-bold text-white">
                  {randomResult.name}
                </div>
                <div className="text-xs text-stone-300">
                  {randomResult.role} • Fold: {randomResult.fold}
                </div>
              </div>
            ) : (
              <div className="text-stone-400 text-sm">
                Press "Pick Random Person" to select someone
              </div>
            )}
          </div>

          <button
            onClick={handlePickRandom}
            disabled={isPicking}
            className="btn-gold px-8 py-3 text-sm font-semibold flex items-center justify-center gap-2 mx-auto"
          >
            <Shuffle className={`w-4 h-4 ${isPicking ? 'animate-spin' : ''}`} />
            <span>{isPicking ? 'Selecting...' : 'Pick Random Person 🎲'}</span>
          </button>

          {/* Pick History */}
          {randomHistory.length > 0 && (
            <div className="text-left pt-6 border-t border-[var(--border)]">
              <h4 className="text-xs font-semibold text-[var(--deep)] mb-2">
                Recent Picks History
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {randomHistory.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#FAF5EB]">
                    <span className="font-semibold text-[var(--deep)]">{h.name}</span>
                    <span className="text-[11px] text-[var(--muted)]">{h.fold} • {h.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 9: NEON DATABASE ── */}
      {activeTab === 'database' && (
        <div className="regal-card p-6 space-y-6">
          <div>
            <h3 className="font-serif text-lg font-bold text-[var(--deep)] flex items-center gap-2">
              <Database className="w-5 h-5 text-[var(--gold)]" />
              Neon PostgreSQL Database Configuration
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Connect your serverless PostgreSQL database to persist all leaders, members, and follow-up reports.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border)] bg-[#FAF5EB] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--deep)]">Connection Status:</span>
                <span
                  className={`badge ${
                    neonMode === 'neon' ? 'badge-done' : 'badge-gold'
                  }`}
                >
                  {neonMode === 'neon' ? 'Connected to Neon PostgreSQL' : 'Local / In-Memory Mode'}
                </span>
              </div>

              <button
                onClick={onRefreshData}
                className="btn-secondary px-3 py-1.5 text-xs font-medium"
              >
                Test Connection & Sync
              </button>
            </div>

            <div className="text-xs text-[var(--text2)] space-y-2">
              <p>
                To connect to your Neon database, set your <code className="bg-white px-1.5 py-0.5 rounded border border-[var(--border)] font-mono text-[11px]">DATABASE_URL</code> in <code className="bg-white px-1.5 py-0.5 rounded border border-[var(--border)] font-mono text-[11px]">.env.local</code>:
              </p>
              <pre className="p-3 rounded-lg bg-[var(--deep)] text-[var(--gold-light)] font-mono text-xs overflow-x-auto">
DATABASE_URL="postgresql://[user]:[password]@[neon-host]/neondb?sslmode=require"
              </pre>
              <p className="text-[11px] text-[var(--muted)]">
                The database schema and tables (<code className="font-mono">leaders</code>, <code className="font-mono">members</code>, <code className="font-mono">followups</code>, <code className="font-mono">visitations</code>, <code className="font-mono">prayer_list</code>, <code className="font-mono">needs_info_list</code>, <code className="font-mono">events</code>, <code className="font-mono">attendance</code>) will be created and seeded automatically on first connection!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
