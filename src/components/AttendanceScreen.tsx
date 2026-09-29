'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Leader, Member, EventItem } from '@/lib/types';
import {
  ArrowLeft,
  Check,
  X,
  Send,
  Search,
  ChevronDown,
} from 'lucide-react';

interface AttendanceMember {
  name: string;
  phone: string;
  leaderId: string;
  leaderName: string;
  // Two different people can share a name within the same fold (or both unassigned) --
  // this disambiguates React's rendering identity only. Attendance state and record
  // matching still key by name, same as the backend, which has no per-member id.
  idx: number;
}

interface AttendanceScreenProps {
  // 'fold': currentLeader marks attendance for their own fold only.
  // 'all': admin marks attendance for every member across every fold in one pass.
  mode: 'fold' | 'all';
  currentLeader?: Leader;
  leaders?: Leader[];
  unassigned?: Member[];
  events: EventItem[];
  onBack: () => void;
  onSubmitAttendance: (payload: {
    eventId: string;
    eventName: string;
    leaderId: string;
    leaderName: string;
    attendance: { memberName: string; present: boolean }[];
  }) => Promise<void>;
  fetchEventAttendance: (eventId: string, leaderId?: string) => Promise<any[]>;
}

const keyFor = (leaderId: string, name: string) => `${leaderId}::${name.trim().toLowerCase()}`;

export const AttendanceScreen: React.FC<AttendanceScreenProps> = ({
  mode,
  currentLeader,
  leaders,
  unassigned,
  events,
  onBack,
  onSubmitAttendance,
  fetchEventAttendance,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(
    events.length > 0 ? events[0].id : ''
  );
  const [attendanceState, setAttendanceState] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [collapsedFolds, setCollapsedFolds] = useState<Set<string>>(new Set());

  const selectedEvent = events.find(e => e.id === selectedEventId) || events[0];

  const members: AttendanceMember[] = useMemo(() => {
    if (mode === 'fold' && currentLeader) {
      return (currentLeader.members || []).map((m, idx) => ({
        name: m.name,
        phone: m.phone,
        leaderId: currentLeader.id,
        leaderName: currentLeader.name,
        idx,
      }));
    }
    if (mode === 'all') {
      let idx = 0;
      const fromLeaders = (leaders || []).flatMap(l =>
        (l.members || []).map(m => ({ name: m.name, phone: m.phone, leaderId: l.id, leaderName: l.name, idx: idx++ }))
      );
      const fromUnassigned = (unassigned || []).map(m => ({
        name: m.name,
        phone: m.phone,
        leaderId: '',
        leaderName: 'Unassigned',
        idx: idx++,
      }));
      return [...fromLeaders, ...fromUnassigned];
    }
    return [];
  }, [mode, currentLeader, leaders, unassigned]);

  // Load existing attendance for this event (scoped to the fold in 'fold' mode, everyone in 'all' mode)
  useEffect(() => {
    if (!selectedEvent) return;

    let isMounted = true;
    setLoading(true);

    fetchEventAttendance(selectedEvent.id, mode === 'fold' ? currentLeader?.id : undefined)
      .then(records => {
        if (!isMounted) return;
        const initial: Record<string, boolean> = {};
        members.forEach(m => {
          initial[keyFor(m.leaderId, m.name)] = false;
        });
        records.forEach((r: any) => {
          const name = r.memberName || r.membername;
          if (!name) return;
          initial[keyFor(r.leaderId ?? '', name)] = r.present === true || r.present === 'true';
        });
        setAttendanceState(initial);
      })
      .catch(() => {
        if (!isMounted) return;
        const initial: Record<string, boolean> = {};
        members.forEach(m => {
          initial[keyFor(m.leaderId, m.name)] = false;
        });
        setAttendanceState(initial);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId, mode, currentLeader?.id, members.length]);

  const toggleMember = (leaderId: string, name: string) => {
    const k = keyFor(leaderId, name);
    setAttendanceState(prev => ({ ...prev, [k]: !prev[k] }));
  };

  const toggleAll = (state: boolean) => {
    const next: Record<string, boolean> = {};
    members.forEach(m => {
      next[keyFor(m.leaderId, m.name)] = state;
    });
    setAttendanceState(next);
  };

  const presentCount = members.filter(m => attendanceState[keyFor(m.leaderId, m.name)]).length;
  const absentCount = members.length - presentCount;

  const filteredMembers = search.trim()
    ? members.filter(
        m =>
          m.name.toLowerCase().includes(search.trim().toLowerCase()) ||
          m.leaderName.toLowerCase().includes(search.trim().toLowerCase())
      )
    : members;

  // In 'all' mode, group by fold so ~150 members reads as a scannable directory,
  // not one wall of rows -- same pattern as the admin Submissions Audit log.
  const groups: { leaderId: string; leaderName: string; members: AttendanceMember[] }[] = [];
  if (mode === 'all') {
    const idx = new Map<string, number>();
    filteredMembers.forEach(m => {
      if (!idx.has(m.leaderId)) {
        idx.set(m.leaderId, groups.length);
        groups.push({ leaderId: m.leaderId, leaderName: m.leaderName, members: [] });
      }
      groups[idx.get(m.leaderId)!].members.push(m);
    });
    groups.sort((a, b) => a.leaderId.localeCompare(b.leaderId));
  }

  const toggleFold = (leaderId: string) => {
    setCollapsedFolds(prev => {
      const next = new Set(prev);
      if (next.has(leaderId)) next.delete(leaderId);
      else next.add(leaderId);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!selectedEvent) return;
    setSaving(true);
    try {
      if (mode === 'fold' && currentLeader) {
        const records = members.map(m => ({
          memberName: m.name,
          present: !!attendanceState[keyFor(m.leaderId, m.name)],
        }));
        await onSubmitAttendance({
          eventId: selectedEvent.id,
          eventName: selectedEvent.name,
          leaderId: currentLeader.id,
          leaderName: currentLeader.name,
          attendance: records,
        });
      } else {
        // 'all' mode: the API/db scope clearing+inserts by {eventId, leaderId}, so submit
        // one call per fold -- correct and idempotent per fold, no backend change needed.
        const byLeader = new Map<string, { leaderName: string; records: { memberName: string; present: boolean }[] }>();
        members.forEach(m => {
          if (!byLeader.has(m.leaderId)) byLeader.set(m.leaderId, { leaderName: m.leaderName, records: [] });
          byLeader.get(m.leaderId)!.records.push({
            memberName: m.name,
            present: !!attendanceState[keyFor(m.leaderId, m.name)],
          });
        });
        await Promise.all(
          Array.from(byLeader.entries()).map(([leaderId, { leaderName, records }]) =>
            onSubmitAttendance({
              eventId: selectedEvent.id,
              eventName: selectedEvent.name,
              leaderId,
              leaderName,
              attendance: records,
            })
          )
        );
      }
      onBack();
    } finally {
      setSaving(false);
    }
  };

  const renderRow = (member: AttendanceMember) => {
    const isPresent = !!attendanceState[keyFor(member.leaderId, member.name)];
    return (
      <button
        type="button"
        key={`${keyFor(member.leaderId, member.name)}#${member.idx}`}
        onClick={() => toggleMember(member.leaderId, member.name)}
        aria-pressed={isPresent}
        className="row-link w-full text-left px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3"
      >
        <div className="min-w-0">
          <div className="font-semibold text-[15px] text-[var(--deep)] truncate">{member.name}</div>
          {mode === 'all' ? (
            <div className="text-[13px] text-[var(--muted)] tnum">{member.phone || '—'}</div>
          ) : (
            member.phone && <div className="text-[13px] text-[var(--muted)] tnum">{member.phone}</div>
          )}
        </div>

        <span
          className={`px-3.5 min-h-9 rounded-full text-sm font-semibold inline-flex items-center gap-1.5 flex-shrink-0 transition-colors ${
            isPresent
              ? 'bg-[var(--success)] text-white'
              : 'bg-[var(--bg)] text-[var(--muted)] ring-1 ring-inset ring-[var(--border)]'
          }`}
        >
          {isPresent ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {isPresent ? 'Present' : 'Absent'}
        </span>
      </button>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6 pb-28 sm:pb-10">
      {mode === 'fold' && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--deep)] transition-colors py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to my fold</span>
        </button>
      )}

      <section className="hero-panel p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-3 text-xs">
              <span className="font-bold px-2 py-0.5 rounded-md bg-[var(--gold)] text-[var(--deep)] uppercase">
                {selectedEvent?.type || 'Event'}
              </span>
              <span className="text-[var(--gold-light)] tnum">
                {selectedEvent?.date ? new Date(selectedEvent.date).toLocaleDateString('en-GB') : ''}
              </span>
            </div>
            <h2 className="font-serif text-3xl font-bold leading-[1.1] text-balance text-white">
              {selectedEvent ? selectedEvent.name : 'Mark attendance'}
            </h2>
            <p className="text-sm text-[#D9CDB2] mt-2">
              {mode === 'fold' && currentLeader
                ? `${currentLeader.name} · ${currentLeader.id}`
                : `All folds · ${members.length} members`}
            </p>
          </div>

          <div className="sm:w-64">
            <label htmlFor="event-picker" className="block text-xs font-medium text-[#D9CDB2] mb-1.5">
              Event
            </label>
            <select
              id="event-picker"
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
              className="regal-input"
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({ev.date?.slice(0, 10)})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-white tnum" aria-live="polite">
            <span className="font-semibold">{presentCount}</span> present
            <span className="text-[#D9CDB2]"> · {absentCount} absent · {members.length} total</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleAll(true)}
              className="text-sm font-medium px-3.5 min-h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              All present
            </button>
            <button
              type="button"
              onClick={() => toggleAll(false)}
              className="text-sm font-medium px-3.5 min-h-10 rounded-xl text-[#D9CDB2] hover:text-white transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {mode === 'all' && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search member or fold leader"
            className="regal-input pl-10"
          />
        </div>
      )}

      {mode === 'fold' ? (
        <section className="regal-card overflow-hidden">
          <div className="divide-y divide-[var(--border-light)] stagger">
            {filteredMembers.map(renderRow)}
            {filteredMembers.length === 0 && (
              <div className="p-10 text-center text-sm text-[var(--muted)]">No members in this fold yet.</div>
            )}
          </div>
        </section>
      ) : (
        <div className="space-y-3">
          {groups.map(group => {
            const isOpen = !collapsedFolds.has(group.leaderId);
            const groupPresent = group.members.filter(m => attendanceState[keyFor(m.leaderId, m.name)]).length;
            return (
              <div key={group.leaderId || 'unassigned'} className="rounded-xl border border-[var(--border-light)] overflow-hidden">
                <button
                  onClick={() => toggleFold(group.leaderId)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-[#FAF5EB] hover:bg-[var(--gold-pale)] transition-colors text-left"
                >
                  <ChevronDown className={`w-4 h-4 text-[var(--muted)] flex-shrink-0 transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
                  {group.leaderId && (
                    <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--bg2)] text-[var(--deep)]">
                      {group.leaderId}
                    </span>
                  )}
                  <h4 className="font-semibold text-sm text-[var(--deep)]">{group.leaderName}</h4>
                  <span className="text-[11px] text-[var(--muted)] tnum ml-auto">
                    {groupPresent}/{group.members.length} present
                  </span>
                </button>
                {isOpen && (
                  <div className="divide-y divide-[var(--border-light)]">
                    {group.members.map(renderRow)}
                  </div>
                )}
              </div>
            );
          })}

          {groups.length === 0 && (
            <div className="regal-card p-10 text-center text-sm text-[var(--muted)]">
              {search ? `No one matches "${search}".` : 'No members recorded yet.'}
            </div>
          )}
        </div>
      )}

      {/* Submit: pinned above the mobile nav */}
      <div className="fixed sm:static left-0 right-0 bottom-[var(--nav-h)] sm:bottom-auto z-30 px-4 py-3 sm:p-0 bg-[var(--bg)]/95 sm:bg-transparent border-t border-[var(--border-light)] sm:border-0 flex items-center justify-between gap-4">
        <span className="hidden sm:block text-sm text-[var(--muted)]">
          Saves records for {selectedEvent?.name}
        </span>
        <button
          onClick={handleSubmit}
          disabled={saving || loading || members.length === 0}
          className="btn-gold w-full sm:w-auto px-6 py-2.5 text-sm flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span>{saving ? 'Saving…' : 'Submit attendance'}</span>
        </button>
      </div>
    </div>
  );
};
