'use client';

import React, { useState, useEffect } from 'react';
import { Leader, EventItem } from '@/lib/types';
import {
  ArrowLeft,
  Calendar,
  Check,
  X,
  Users,
  Send,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface AttendanceScreenProps {
  currentLeader: Leader;
  events: EventItem[];
  onBack: () => void;
  onSubmitAttendance: (payload: {
    eventId: string;
    eventName: string;
    leaderId: string;
    leaderName: string;
    attendance: { memberName: string; present: boolean }[];
  }) => Promise<void>;
  fetchEventAttendance: (eventId: string, leaderId: string) => Promise<any[]>;
}

export const AttendanceScreen: React.FC<AttendanceScreenProps> = ({
  currentLeader,
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

  const selectedEvent = events.find(e => e.id === selectedEventId) || events[0];
  const members = currentLeader.members || [];

  // Load existing attendance for this event and leader
  useEffect(() => {
    if (!selectedEvent) return;

    let isMounted = true;
    setLoading(true);

    fetchEventAttendance(selectedEvent.id, currentLeader.id)
      .then(records => {
        if (!isMounted) return;
        const initial: Record<string, boolean> = {};
        // Default to false for all members
        members.forEach(m => {
          initial[m.name] = false;
        });
        // Apply existing records
        records.forEach(r => {
          initial[r.memberName || r.membername] =
            r.present === true || r.present === 'true';
        });
        setAttendanceState(initial);
      })
      .catch(() => {
        if (!isMounted) return;
        const initial: Record<string, boolean> = {};
        members.forEach(m => {
          initial[m.name] = false;
        });
        setAttendanceState(initial);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedEventId, currentLeader.id]);

  const toggleMember = (name: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const toggleAll = (state: boolean) => {
    const next: Record<string, boolean> = {};
    members.forEach(m => {
      next[m.name] = state;
    });
    setAttendanceState(next);
  };

  const presentCount = members.filter(m => attendanceState[m.name]).length;
  const absentCount = members.length - presentCount;

  const handleSubmit = async () => {
    if (!selectedEvent) return;
    setSaving(true);
    try {
      const records = members.map(m => ({
        memberName: m.name,
        present: !!attendanceState[m.name],
      }));

      await onSubmitAttendance({
        eventId: selectedEvent.id,
        eventName: selectedEvent.name,
        leaderId: currentLeader.id,
        leaderName: currentLeader.name,
        attendance: records,
      });
      onBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)] hover:text-[var(--deep)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Fold Dashboard</span>
        </button>
      </div>

      {/* Event Header Card */}
      <div className="regal-card p-6 bg-gradient-to-br from-[#FFFDF9] via-[#FAF5EC] to-[#F5EFE3] shadow-md border-[var(--border)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-gold">
                {selectedEvent?.type || 'EVENT'}
              </span>
              <span className="text-xs text-[var(--muted)] font-mono">
                {selectedEvent?.date ? new Date(selectedEvent.date).toLocaleDateString('en-GB') : ''}
              </span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-[var(--deep)]">
              {selectedEvent ? selectedEvent.name : 'Mark Attendance'}
            </h2>
            <p className="text-xs text-[var(--muted)] mt-1">
              Fold: <strong className="text-[var(--deep)]">{currentLeader.name}</strong> ({currentLeader.id})
            </p>
          </div>

          {/* Event Picker Dropdown */}
          <div className="sm:w-64">
            <label className="block text-[11px] font-semibold text-[var(--deep)] mb-1">
              Choose Event
            </label>
            <select
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
              className="regal-input text-xs"
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({ev.date?.slice(0, 10)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Pill & Controls */}
        <div className="mt-6 pt-5 border-t border-[var(--border-light)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="px-3 py-1.5 rounded-full bg-[var(--success-bg)] text-[var(--success)] border border-emerald-300 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {presentCount} Present
            </span>
            <span className="px-3 py-1.5 rounded-full bg-[var(--error-bg)] text-[var(--error)] border border-red-300 flex items-center gap-1.5">
              <X className="w-3.5 h-3.5" />
              {absentCount} Absent
            </span>
            <span className="text-[var(--muted)] hidden sm:inline">
              Total: {members.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleAll(true)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors"
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => toggleAll(false)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Member Attendance Toggle List */}
      <div className="regal-card overflow-hidden">
        <div className="p-4 bg-[#FAF5EB] border-b border-[var(--border)] font-semibold text-xs text-[var(--deep)] flex items-center justify-between">
          <span>Member Name</span>
          <span>Attendance Status</span>
        </div>

        <div className="divide-y divide-[var(--border-light)]">
          {members.map(member => {
            const isPresent = !!attendanceState[member.name];
            return (
              <div
                key={member.name}
                onClick={() => toggleMember(member.name)}
                className="p-4 flex items-center justify-between gap-3 hover:bg-[var(--gold-pale)]/50 cursor-pointer transition-colors"
              >
                <div>
                  <div className="font-semibold text-sm text-[var(--deep)]">
                    {member.name}
                  </div>
                  {member.phone && (
                    <div className="text-[11px] text-[var(--muted)] font-mono">
                      {member.phone}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isPresent
                      ? 'bg-[var(--success)] text-white shadow-sm'
                      : 'bg-stone-100 text-stone-600 border border-stone-300 hover:bg-stone-200'
                  }`}
                >
                  {isPresent ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Present</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3.5 h-3.5 text-stone-400" />
                      <span>Absent</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}

          {members.length === 0 && (
            <div className="p-8 text-center text-xs text-[var(--muted)]">
              No members found in this fold.
            </div>
          )}
        </div>

        {/* Submit Attendance Bar */}
        <div className="p-4 bg-[#FAF5EB] border-t border-[var(--border)] flex items-center justify-between">
          <span className="text-xs text-[var(--muted)]">
            Ready to commit attendance records for {selectedEvent?.name}
          </span>
          <button
            onClick={handleSubmit}
            disabled={saving || members.length === 0}
            className="btn-gold px-6 py-2.5 text-xs sm:text-sm font-semibold flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Submit Attendance'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
