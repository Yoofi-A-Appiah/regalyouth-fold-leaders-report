'use client';

import React, { useState } from 'react';
import {
  Leader,
  Member,
  Submission,
  PrayerRequest,
  NeedsInfoItem,
  EventItem,
  AttendanceRecord,
  ExecResource,
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
  Plus,
  Trash2,
  Printer,
  Search,
  CheckCircle,
  ExternalLink,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  Crown,
} from 'lucide-react';

interface AdminPortalProps {
  stats: AdminStats | null;
  leaders: Leader[];
  unassigned: Member[];
  events: EventItem[];
  attendance: AttendanceRecord[];
  resources: ExecResource[];
  isSuperAdmin: boolean;
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
  onSetExecutive: (payload: { leaderId: string; isExecutive: boolean }) => Promise<void>;
  onSetFoldCoordinator: (payload: { leaderId: string; isFoldCoordinator: boolean }) => Promise<void>;
  onAddResource: (payload: { title: string; url: string }) => Promise<void>;
  onDeleteResource: (id: string) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  stats,
  leaders,
  unassigned,
  events,
  attendance,
  resources,
  isSuperAdmin,
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
  onSetExecutive,
  onSetFoldCoordinator,
  onAddResource,
  onDeleteResource,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'events'
    | 'performance'
    | 'analytics'
    | 'members'
    | 'prayer'
    | 'needsinfo'
    | 'submissions'
    | 'random'
    | 'executives'
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
  const [subLeaderFilter, setSubLeaderFilter] = useState<string>('all');
  const [subSearch, setSubSearch] = useState('');
  const [expandedFolds, setExpandedFolds] = useState<Set<string>>(new Set());

  // Youth Executives Tab (Super Admin only)
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [execLeaderSearch, setExecLeaderSearch] = useState('');

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

  // Per-leader submission counts, for the Master Submissions Log's fold filter
  const submissionCountByLeader = submissions.reduce<Record<string, number>>((acc, s) => {
    acc[s.leaderId] = (acc[s.leaderId] || 0) + 1;
    return acc;
  }, {});
  const leadersWithSubmissions = [...leaders]
    .sort((a, b) => a.id.localeCompare(b.id))
    .filter(l => submissionCountByLeader[l.id]);

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

  // Handle Add Resource (Youth Executives tab)
  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResourceTitle.trim() || !newResourceUrl.trim()) return;
    await onAddResource({ title: newResourceTitle.trim(), url: newResourceUrl.trim() });
    setNewResourceTitle('');
    setNewResourceUrl('');
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
          { id: 'analytics', label: 'Follow-Up Impact', icon: TrendingUp },
          { id: 'members', label: 'Members Directory', icon: Users },
          { id: 'prayer', label: 'Prayer Wall', icon: Flame },
          { id: 'needsinfo', label: 'Needs Info', icon: HelpCircle },
          { id: 'submissions', label: 'Submissions Audit', icon: FileText },
          { id: 'random', label: 'Random Picker', icon: Shuffle },
          // Only the Super Admin (hardcoded flag, not a passcode session) can designate
          // Fold Coordinators/Executives and curate the resource catalogue.
          ...(isSuperAdmin ? [{ id: 'executives', label: 'Youth Executives', icon: Crown }] : []),
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
            {/* Add Leader Form -- Super Admin only */}
            {isSuperAdmin && (
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
            )}

            {/* Fold Leaders Roster */}
            <div className={`regal-card p-5 space-y-4 ${isSuperAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-bold text-[var(--deep)]">
                  Fold Leaders Directory ({leaders.length})
                </h3>
                {!isSuperAdmin && (
                  <span className="text-[11px] text-[var(--muted)]">Only Super Admin can register new leaders</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {leaders.map(l => (
                  <div
                    key={l.id}
                    className="p-3 rounded-xl border border-[var(--border-light)] bg-[#FFFDF9] flex items-center justify-between gap-3 hover:border-[var(--gold)] transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-[var(--bg2)] text-[var(--deep)]">
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
                      <span className="badge badge-gold text-[11px]">
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
      {activeTab === 'performance' && (() => {
        // Compliance is only meaningful *within* one reporting period -- a leader's
        // fold size and roster both drift over time, so blending every period into
        // one lifetime number hides recent gaps behind old good months. When "ALL"
        // is selected, render one clearly-demarcated table per period instead of
        // pooling their submissions together.
        const periodsToShow = selectedPerfPeriod === 'ALL'
          ? [...submissionPeriods].sort().reverse()
          : [selectedPerfPeriod];

        return (
        <div className="regal-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-[var(--deep)]">
                Fold Leader Submission Performance
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Follow-up coverage per fold, measured against that period's fold size -- one table per reporting period
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

          {periodsToShow.map(period => (
            <div key={period} className="space-y-3">
              {selectedPerfPeriod === 'ALL' && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="badge badge-gold">Period {period}</span>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[#FAF5EB] text-[var(--deep)]">
                      <th className="p-3 font-semibold">Leader</th>
                      <th className="p-3 font-semibold">Fold Size</th>
                      <th className="p-3 font-semibold">Follow-Ups</th>
                      <th className="p-3 font-semibold">Visitations</th>
                      <th className="p-3 font-semibold">Total Submissions</th>
                      <th className="p-3 font-semibold">Members Reported</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-light)]">
                    {leaders.map(leader => {
                      const foldSize = leader.members.length;
                      const relevantSubs = submissions.filter(
                        s => s.leaderId === leader.id && s.period === period
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

                      const rate = foldSize > 0 ? Math.round((uniqueCount / foldSize) * 100) : null;

                      return (
                        <tr key={leader.id} className="hover:bg-[var(--gold-pale)]/40 transition-colors">
                          <td className="p-3">
                            <div className="font-semibold text-[var(--deep)]">{leader.name}</div>
                            <div className="font-mono text-[11px] text-[var(--muted)]">{leader.id}</div>
                          </td>
                          <td className="p-3 font-medium tnum">{foldSize}</td>
                          <td className="p-3 font-medium text-emerald-800 tnum">{fuCount}</td>
                          <td className="p-3 font-medium text-amber-800 tnum">{visCount}</td>
                          <td className="p-3 font-bold tnum">{total}</td>
                          <td className="p-3">
                            {rate === null ? (
                              <span className="text-[var(--muted)]">No members assigned</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-stone-200 rounded-full overflow-hidden flex-shrink-0">
                                  <div
                                    className="h-full bg-gradient-to-r from-[var(--gold)] to-[var(--success)] rounded-full"
                                    style={{ width: `${rate}%` }}
                                  />
                                </div>
                                <span className="font-semibold tnum">{uniqueCount}/{foldSize} ({rate}%)</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {periodsToShow.length === 0 && (
            <p className="text-center text-xs text-[var(--muted)] py-12">
              No reporting periods recorded yet.
            </p>
          )}
        </div>
        );
      })()}

      {/* ── TAB 3b: FOLLOW-UP IMPACT ANALYTICS ── */}
      {activeTab === 'analytics' && (() => {
        type MemberStat = {
          name: string;
          leaderName: string;
          leaderId: string;
          contactedPeriods: number;
          totalContacts: number;
          present: number;
          totalMarked: number;
        };

        const memberStats: MemberStat[] = [];
        leaders.forEach(leader => {
          (leader.members || []).forEach(member => {
            const key = member.name.trim().toLowerCase();
            const contactSubs = submissions.filter(
              s => s.leaderId === leader.id && s.memberName.trim().toLowerCase() === key
            );
            const contactedPeriods = new Set(contactSubs.map(s => s.period)).size;

            const records = attendance.filter(
              a => a.leaderId === leader.id && a.memberName.trim().toLowerCase() === key
            );
            const present = records.filter(a => a.present).length;

            memberStats.push({
              name: member.name,
              leaderName: leader.name,
              leaderId: leader.id,
              contactedPeriods,
              totalContacts: contactSubs.length,
              present,
              totalMarked: records.length,
            });
          });
        });

        // Only members who were actually marked at an event have a measurable attendance
        // rate -- everyone else would silently skew any average toward 0% or get excluded
        // unfairly, so they're kept out of the correlation and buckets, but still visible
        // in the at-risk list (marked = 0 already reads as "no attendance data yet" there).
        const withAttendance = memberStats.filter(m => m.totalMarked > 0);

        const buckets: { label: string; test: (m: MemberStat) => boolean }[] = [
          { label: 'Never followed up', test: m => m.contactedPeriods === 0 },
          { label: 'Occasional (1-2 periods)', test: m => m.contactedPeriods >= 1 && m.contactedPeriods <= 2 },
          { label: 'Regular (3+ periods)', test: m => m.contactedPeriods >= 3 },
        ];
        const bucketStats = buckets.map(b => {
          const members = withAttendance.filter(b.test);
          const present = members.reduce((sum, m) => sum + m.present, 0);
          const totalMarked = members.reduce((sum, m) => sum + m.totalMarked, 0);
          return {
            ...b,
            memberCount: members.length,
            rate: totalMarked > 0 ? Math.round((present / totalMarked) * 100) : null,
          };
        });

        // Pearson correlation between "periods contacted" and "individual attendance rate"
        const corrPoints = withAttendance.map(m => ({
          x: m.contactedPeriods,
          y: m.present / m.totalMarked,
        }));
        let correlation: number | null = null;
        if (corrPoints.length >= 3) {
          const n = corrPoints.length;
          const mx = corrPoints.reduce((s, p) => s + p.x, 0) / n;
          const my = corrPoints.reduce((s, p) => s + p.y, 0) / n;
          const cov = corrPoints.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
          const vx = Math.sqrt(corrPoints.reduce((s, p) => s + (p.x - mx) ** 2, 0));
          const vy = Math.sqrt(corrPoints.reduce((s, p) => s + (p.y - my) ** 2, 0));
          correlation = vx > 0 && vy > 0 ? cov / (vx * vy) : null;
        }
        const corrStrength = (r: number) => {
          const a = Math.abs(r);
          const strength = a < 0.1 ? 'negligible' : a < 0.3 ? 'weak' : a < 0.5 ? 'moderate' : a < 0.7 ? 'strong' : 'very strong';
          return `${strength} ${r >= 0 ? 'positive' : 'negative'}`;
        };

        // At-risk: never contacted, and either never attended or attendance is measurably low
        const atRisk = memberStats
          .filter(m => m.contactedPeriods === 0 && (m.totalMarked === 0 || m.present / m.totalMarked < 0.5))
          .sort((a, b) => (a.totalMarked === 0 ? -1 : a.present / a.totalMarked) - (b.totalMarked === 0 ? -1 : b.present / b.totalMarked))
          .slice(0, 12);

        return (
        <div className="space-y-6">
          <div className="regal-card p-6 space-y-1">
            <h3 className="font-serif text-lg font-bold text-[var(--deep)] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[var(--gold)]" />
              Follow-Up Impact on Attendance
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Does regular follow-up actually correlate with a youth showing up? Measured across
              {' '}{withAttendance.length} member{withAttendance.length === 1 ? '' : 's'} who have at least one attendance record
              {memberStats.length - withAttendance.length > 0 && (
                <> ({memberStats.length - withAttendance.length} excluded -- never marked at an event)</>
              )}.
            </p>
          </div>

          {withAttendance.length < 3 ? (
            <div className="regal-card p-8 text-center">
              <p className="text-sm text-[var(--muted)]">
                Not enough attendance history yet to compare follow-up regularity against attendance.
                Mark attendance at a few more events first.
              </p>
            </div>
          ) : (
          <>
          {/* Headline correlation */}
          <div className="regal-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="badge badge-gold">Correlation</span>
            </div>
            {correlation === null ? (
              <p className="text-sm text-[var(--muted)]">Not enough variation in the data yet to compute a correlation.</p>
            ) : (
              <p className="text-sm text-[var(--text2)]">
                Members contacted in more reporting periods tend to attend{' '}
                <strong className="text-[var(--deep)]">{correlation >= 0 ? 'more' : 'less'} often</strong> --
                a <strong className="text-[var(--deep)]">{corrStrength(correlation)}</strong> correlation
                (r = <span className="font-mono">{correlation.toFixed(2)}</span>) between periods-contacted and attendance rate.
              </p>
            )}
          </div>

          {/* Bucketed comparison */}
          <div className="regal-card p-6 space-y-4">
            <div>
              <h4 className="font-serif text-base font-bold text-[var(--deep)]">Attendance rate by follow-up regularity</h4>
              <p className="text-xs text-[var(--muted)]">Attendance rate pooled across every member in each group</p>
            </div>
            <div className="space-y-3">
              {bucketStats.map(b => (
                <div key={b.label}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-[var(--deep)]">{b.label}</span>
                    <span className="text-[var(--muted)]">
                      {b.memberCount} member{b.memberCount === 1 ? '' : 's'}
                      {b.rate !== null && <span className="font-bold text-[var(--deep)] ml-2">{b.rate}%</span>}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden">
                    {b.rate !== null && (
                      <div
                        className="h-full bg-gradient-to-r from-[var(--gold)] to-[var(--success)] rounded-full transition-all duration-500"
                        style={{ width: `${b.rate}%` }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* At-risk list */}
          <div className="regal-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <h4 className="font-serif text-base font-bold text-[var(--deep)]">Never followed up, and falling away</h4>
            </div>
            <p className="text-xs text-[var(--muted)] -mt-2">
              No follow-up on record, and either never attended or attending less than half the time -- prioritize these first
            </p>
            {atRisk.length === 0 ? (
              <p className="text-sm text-[var(--success)] font-medium">No one currently matches this -- great shepherding.</p>
            ) : (
              <div className="divide-y divide-[var(--border-light)]">
                {atRisk.map(m => (
                  <div key={`${m.leaderId}-${m.name}`} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-sm text-[var(--deep)]">{m.name}</div>
                      <div className="text-[11px] text-[var(--muted)] font-mono">{m.leaderId} · {m.leaderName}</div>
                    </div>
                    <span className="badge badge-pending">
                      {m.totalMarked === 0 ? 'Never marked' : `${Math.round((m.present / m.totalMarked) * 100)}% attendance`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          </>
          )}
        </div>
        );
      })()}

      {/* ── TAB (SUPER ADMIN ONLY): YOUTH EXECUTIVES ── */}
      {activeTab === 'executives' && isSuperAdmin && (() => {
        const filteredLeaders = leaders.filter(
          l =>
            l.name.toLowerCase().includes(execLeaderSearch.toLowerCase()) ||
            l.id.toLowerCase().includes(execLeaderSearch.toLowerCase())
        );

        return (
        <div className="space-y-6">
          <div className="regal-card p-6 space-y-1">
            <h3 className="font-serif text-lg font-bold text-[var(--deep)] flex items-center gap-2">
              <Crown className="w-5 h-5 text-[var(--gold)]" />
              Youth Executives
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Grant Fold Coordinator (full admin access) or Executive (view-only resource tab) to fold leaders,
              and manage the Google Docs/Sheets shown on their Executive tab.
            </p>
          </div>

          {/* Roles */}
          <div className="regal-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h4 className="font-serif text-base font-bold text-[var(--deep)]">Fold Leader Roles</h4>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
                <input
                  type="search"
                  value={execLeaderSearch}
                  onChange={e => setExecLeaderSearch(e.target.value)}
                  placeholder="Search leader name or ID"
                  className="regal-input text-xs py-1.5 pl-8"
                />
              </div>
            </div>

            <div className="divide-y divide-[var(--border-light)] max-h-[28rem] overflow-y-auto">
              {filteredLeaders.map(l => (
                <div key={l.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-[var(--bg2)] text-[var(--deep)]">
                        {l.id}
                      </span>
                      <span className="font-semibold text-xs text-[var(--deep)]">{l.name}</span>
                      {l.isSuperAdmin && <span className="badge badge-gold">Super Admin</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSetFoldCoordinator({ leaderId: l.id, isFoldCoordinator: !l.isFoldCoordinator })}
                      disabled={!!l.isSuperAdmin}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        l.isFoldCoordinator || l.isSuperAdmin ? 'bg-[var(--deep)] text-white' : 'btn-secondary'
                      }`}
                    >
                      Fold Coordinator
                    </button>
                    <button
                      onClick={() => onSetExecutive({ leaderId: l.id, isExecutive: !l.isExecutive })}
                      disabled={!!l.isSuperAdmin}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        l.isExecutive || l.isSuperAdmin ? 'bg-amber-800 text-white' : 'btn-secondary'
                      }`}
                    >
                      Executive
                    </button>
                  </div>
                </div>
              ))}

              {filteredLeaders.length === 0 && (
                <p className="text-xs text-center text-[var(--muted)] py-8">
                  No leaders found matching "{execLeaderSearch}"
                </p>
              )}
            </div>
          </div>

          {/* Resource catalogue */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="regal-card p-5 lg:col-span-1 space-y-4">
              <h4 className="font-serif text-base font-bold text-[var(--deep)] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[var(--gold)]" />
                Add Resource Card
              </h4>
              <form onSubmit={handleAddResource} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--deep)] mb-1">Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Q3 Ministry Plan"
                    value={newResourceTitle}
                    onChange={e => setNewResourceTitle(e.target.value)}
                    className="regal-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--deep)] mb-1">Google Doc/Sheet link</label>
                  <input
                    type="url"
                    placeholder="https://docs.google.com/..."
                    value={newResourceUrl}
                    onChange={e => setNewResourceUrl(e.target.value)}
                    className="regal-input text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-gold w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Resource</span>
                </button>
              </form>
            </div>

            <div className="regal-card p-5 lg:col-span-2 space-y-4">
              <h4 className="font-serif text-base font-bold text-[var(--deep)]">
                Resource Catalogue ({resources.length})
              </h4>
              <div className="divide-y divide-[var(--border-light)]">
                {resources.map(r => (
                  <div key={r.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-[var(--deep)] truncate">{r.title}</div>
                      <div className="text-[11px] text-[var(--muted)] mt-0.5 capitalize">{r.kind}</div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-[var(--muted)] hover:text-[var(--deep)] hover:bg-[var(--gold-pale)] rounded-lg transition-colors"
                        title="Open"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => onDeleteResource(r.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {resources.length === 0 && (
                  <p className="text-xs text-center text-[var(--muted)] py-8">
                    No resources yet. Add a Google Doc or Sheet link above.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        );
      })()}

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
                    {isSuperAdmin && <th className="p-3 font-semibold">Reassign Fold</th>}
                    <th className="p-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-light)]">
                  {filteredMembersList.map((item, idx) => (
                    // Two different people can share a name within the same fold (or both
                    // unassigned) -- the real data has this. idx disambiguates React's
                    // rendering identity only; name is still what every action keys on,
                    // matching the backend, which has no per-member unique id.
                    <tr key={`${item.leaderId}-${item.member.name}-${idx}`} className="hover:bg-[var(--gold-pale)]/30">
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
                      {isSuperAdmin && (
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
                      )}
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
      {activeTab === 'submissions' && (() => {
        const filteredSubs = submissions.filter(s => {
          if (subTypeFilter !== 'all' && s.type !== subTypeFilter) return false;
          if (subLeaderFilter !== 'all' && s.leaderId !== subLeaderFilter) return false;
          if (subSearch.trim()) {
            const q = subSearch.trim().toLowerCase();
            if (!s.memberName.toLowerCase().includes(q) && !s.leaderName.toLowerCase().includes(q)) return false;
          }
          return true;
        });

        // Group by fold so a leader's whole history reads as one block, not scattered
        // rows the admin has to hunt through. Order matches the leader directory (by ID);
        // within a fold, submissions stay newest-first as the API already returns them.
        const groups: { leaderId: string; leaderName: string; subs: Submission[] }[] = [];
        const groupIndex = new Map<string, number>();
        filteredSubs.forEach(sub => {
          if (!groupIndex.has(sub.leaderId)) {
            groupIndex.set(sub.leaderId, groups.length);
            groups.push({ leaderId: sub.leaderId, leaderName: sub.leaderName, subs: [] });
          }
          groups[groupIndex.get(sub.leaderId)!].subs.push(sub);
        });
        groups.sort((a, b) => a.leaderId.localeCompare(b.leaderId));

        const hasActiveFilter = subTypeFilter !== 'all' || subLeaderFilter !== 'all' || subSearch.trim() !== '';

        // Sub-group each fold's submissions by member, so one person's whole history
        // reads as a single labeled thread instead of their name repeating on every card.
        const byMember = (subs: Submission[]) => {
          const out: { name: string; subs: Submission[] }[] = [];
          const idx = new Map<string, number>();
          subs.forEach(sub => {
            const key = sub.memberName.trim().toLowerCase();
            if (!idx.has(key)) {
              idx.set(key, out.length);
              out.push({ name: sub.memberName, subs: [] });
            }
            out[idx.get(key)!].subs.push(sub);
          });
          return out;
        };

        const toggleFold = (leaderId: string) => {
          setExpandedFolds(prev => {
            const next = new Set(prev);
            if (next.has(leaderId)) next.delete(leaderId);
            else next.add(leaderId);
            return next;
          });
        };

        const allExpanded = groups.length > 0 && groups.every(g => expandedFolds.has(g.leaderId));

        return (
        <div className="regal-card p-6 space-y-6">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[var(--deep)]">
                Master Submissions Log
              </h3>
              <p className="text-xs text-[var(--muted)]">
                {hasActiveFilter
                  ? `Showing ${filteredSubs.length} of ${submissions.length} follow-up contacts and home visits`
                  : `Complete historical record — ${submissions.length} follow-up contacts and home visits`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 flex-wrap">
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

              <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
                <select
                  value={subLeaderFilter}
                  onChange={e => setSubLeaderFilter(e.target.value)}
                  aria-label="Filter by fold leader"
                  className="regal-input text-xs py-1.5 w-full sm:w-56"
                >
                  <option value="all">All folds ({leadersWithSubmissions.length})</option>
                  {leadersWithSubmissions.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.id} · {l.name} ({submissionCountByLeader[l.id]})
                    </option>
                  ))}
                </select>

                <div className="relative flex-1 sm:flex-none">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
                  <input
                    type="search"
                    value={subSearch}
                    onChange={e => setSubSearch(e.target.value)}
                    placeholder="Search member or leader"
                    className="regal-input text-xs py-1.5 pl-8 w-full sm:w-52"
                  />
                </div>

                {subLeaderFilter === 'all' && groups.length > 0 && (
                  <button
                    onClick={() => setExpandedFolds(allExpanded ? new Set() : new Set(groups.map(g => g.leaderId)))}
                    className="text-xs font-medium text-[var(--muted)] hover:text-[var(--deep)] px-2 py-1.5"
                  >
                    {allExpanded ? 'Collapse all' : 'Expand all'}
                  </button>
                )}

                {hasActiveFilter && (
                  <button
                    onClick={() => { setSubTypeFilter('all'); setSubLeaderFilter('all'); setSubSearch(''); }}
                    className="text-xs font-medium text-[var(--muted)] hover:text-[var(--deep)] px-2 py-1.5"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {groups.map(group => {
              const isOpen = subLeaderFilter !== 'all' || expandedFolds.has(group.leaderId);
              return (
              <div key={group.leaderId || 'unknown'} className="rounded-xl border border-[var(--border-light)] overflow-hidden">
                {subLeaderFilter === 'all' && (
                  <button
                    onClick={() => toggleFold(group.leaderId)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center gap-2 px-4 py-3 bg-[#FAF5EB] hover:bg-[var(--gold-pale)] transition-colors text-left"
                  >
                    <ChevronDown className={`w-4 h-4 text-[var(--muted)] flex-shrink-0 transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
                    <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--bg2)] text-[var(--deep)]">
                      {group.leaderId || '—'}
                    </span>
                    <h4 className="font-semibold text-sm text-[var(--deep)]">{group.leaderName}</h4>
                    <span className="text-[11px] text-[var(--muted)] tnum ml-auto">
                      {group.subs.length} record{group.subs.length === 1 ? '' : 's'}
                    </span>
                  </button>
                )}

                {isOpen && (
                  <div className="p-3 sm:p-4 space-y-3 bg-white">
                    {byMember(group.subs).map(memberGroup => (
                      <div key={memberGroup.name} className="rounded-lg border border-[var(--border-light)] overflow-hidden">
                        <div className="flex items-baseline justify-between gap-2 px-3 py-2 bg-[#FFFDF9] border-b border-[var(--border-light)]">
                          <h5 className="font-semibold text-xs text-[var(--deep)]">{memberGroup.name}</h5>
                          <span className="text-[10px] text-[var(--muted)] tnum">
                            {memberGroup.subs.length} record{memberGroup.subs.length === 1 ? '' : 's'}
                          </span>
                        </div>

                        <div className="divide-y divide-[var(--border-light)]">
                          {memberGroup.subs.map((sub, idx) => (
                            <div key={sub.id || idx} className="p-3 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <span className={`badge ${sub.type === 'visitation' ? 'bg-amber-100 text-amber-900' : 'badge-done'}`}>
                                  {sub.type === 'visitation' ? 'Visitation' : 'Follow-Up'}
                                </span>
                                <span className="text-[11px] text-[var(--muted)] tnum">
                                  Period <strong className="text-[var(--deep)]">{sub.period}</strong> • {sub.date || new Date(sub.submittedAt).toLocaleDateString('en-GB')}
                                </span>
                              </div>

                              {sub.type === 'followup' ? (
                                <div>
                                  <p className="text-[var(--text2)]">
                                    <strong>Method:</strong> {sub.method} ({sub.context})
                                  </p>
                                  {sub.response && (
                                    <p className="text-[var(--text2)] bg-[var(--gold-pale)]/50 p-2.5 rounded-lg mt-1">
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
                                    <p className="text-[var(--text2)] bg-[var(--gold-pale)]/50 p-2.5 rounded-lg mt-1">
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              );
            })}

            {submissions.length === 0 && (
              <p className="text-center text-xs text-[var(--muted)] py-12">
                No submissions recorded yet.
              </p>
            )}

            {submissions.length > 0 && filteredSubs.length === 0 && (
              <p className="text-center text-xs text-[var(--muted)] py-12">
                No submissions match this filter.
              </p>
            )}
          </div>
        </div>
        );
      })()}

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

    </div>
  );
};
