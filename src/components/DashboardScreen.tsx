'use client';

import React, { useState } from 'react';
import { Leader, Member, Submission, PrayerRequest, NeedsInfoItem } from '@/lib/types';
import {
  Calendar,
  CheckCircle,
  Clock,
  Phone,
  Search,
  MessageCircle,
  HelpCircle,
  Flame,
  ChevronRight,
  ClipboardCheck,
} from 'lucide-react';

interface DashboardScreenProps {
  currentLeader: Leader;
  periodKey: string;
  submissions: Submission[];
  prayerList: PrayerRequest[];
  needsInfoList: NeedsInfoItem[];
  onSelectMember: (member: Member) => void;
  onOpenAttendance: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  currentLeader,
  periodKey,
  submissions,
  prayerList,
  needsInfoList,
  onSelectMember,
  onOpenAttendance,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Format today's date
  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Calculate progress for this leader's members in the current period
  const members = currentLeader.members || [];
  const totalMembers = members.length;

  // Filter submissions for this period and this leader
  const periodSubs = submissions.filter(
    s => s.period === periodKey && s.leaderId === currentLeader.id
  );

  const reportedMemberNames = new Set(
    periodSubs.map(s => s.memberName.trim().toLowerCase())
  );

  const completedCount = members.filter(m =>
    reportedMemberNames.has(m.name.trim().toLowerCase())
  ).length;

  const percentComplete =
    totalMembers > 0 ? Math.round((completedCount / totalMembers) * 100) : 0;

  // Helper to check member statuses
  const getMemberStatus = (member: Member) => {
    const memName = member.name.trim().toLowerCase();
    const hasFollowUp = periodSubs.some(
      s => s.type === 'followup' && s.memberName.trim().toLowerCase() === memName
    );
    const hasVisitation = periodSubs.some(
      s => s.type === 'visitation' && s.memberName.trim().toLowerCase() === memName
    );
    const onPrayer = prayerList.some(
      p =>
        p.leaderId === currentLeader.id &&
        p.memberName.trim().toLowerCase() === memName &&
        (p.active === true || p.active === 'true')
    );
    const needsInfo = needsInfoList.some(
      n =>
        n.leaderId === currentLeader.id &&
        n.memberName.trim().toLowerCase() === memName &&
        (n.active === true || n.active === 'true')
    );

    return { hasFollowUp, hasVisitation, onPrayer, needsInfo };
  };

  // Helper for initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map(part => part[0].toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // Filter members by search
  const filteredMembers = members.filter(
    m =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery)
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Welcome Banner Card */}
      <div className="regal-card p-6 sm:p-7 bg-gradient-to-br from-[#FFFDF9] via-[#FAF5EC] to-[#F5EFE3] border-[var(--border)] shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--deep)] text-[var(--gold-light)]">
                {currentLeader.id}
              </span>
              <span className="badge badge-gold">
                Period {periodKey}
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--deep)]">
              Welcome, {currentLeader.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-[var(--muted)] mt-1">
              <Calendar className="w-3.5 h-3.5 text-[var(--gold)]" />
              <span>{todayFormatted}</span>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAttendance}
              className="btn-gold px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center gap-2"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Mark Event Attendance</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 pt-5 border-t border-[var(--border-light)]">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-[var(--text2)]">
              Fold Reporting Progress ({periodKey})
            </span>
            <span className="text-[#8A6800]">
              {completedCount} of {totalMembers} Reported ({percentComplete}%)
            </span>
          </div>
          <div className="w-full h-3 bg-[#E8E0D0] rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[#C9A84C] to-[#2D7A45] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
          {percentComplete === 100 && totalMembers > 0 && (
            <p className="text-xs text-[var(--success)] font-semibold mt-2 flex items-center gap-1.5 animate-fade-in">
              <CheckCircle className="w-4 h-4" />
              All fold members reported for this period! Excellent shepherdship! 🙌
            </p>
          )}
        </div>
      </div>

      {/* Member Search & Section Label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-bold text-[var(--deep)]">
            Fold Members ({members.length})
          </h3>
          <p className="text-xs text-[var(--muted)]">
            Tap any member to submit follow-up report, visitation, or prayer need
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search member name or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="regal-input pl-9 py-2 text-xs"
          />
        </div>
      </div>

      {/* Member List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredMembers.map(member => {
          const status = getMemberStatus(member);
          const isDone = status.hasFollowUp || status.hasVisitation;

          return (
            <div
              key={member.name}
              onClick={() => onSelectMember(member)}
              className="regal-card p-4 flex items-center justify-between gap-3 cursor-pointer hover:border-[var(--gold)] hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Initials Avatar */}
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-transform group-hover:scale-105 ${
                    isDone
                      ? 'bg-[var(--success-bg)] text-[var(--success)] border border-emerald-400'
                      : 'bg-[var(--gold-pale)] text-[#8A6800] border border-[var(--gold)]/40'
                  }`}
                >
                  {getInitials(member.name)}
                </div>

                <div className="min-w-0">
                  <div className="font-semibold text-sm text-[var(--deep)] truncate group-hover:text-[#8A6800] transition-colors">
                    {member.name}
                  </div>

                  <div className="flex items-center gap-2 mt-0.5">
                    {member.phone ? (
                      <span className="text-[11px] text-[var(--muted)] flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[var(--gold)]" />
                        {member.phone}
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-700 italic">
                        No phone on file
                      </span>
                    )}
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {status.hasFollowUp ? (
                      <span className="badge badge-done text-[10px]">
                        <CheckCircle className="w-3 h-3" />
                        Follow-Up
                      </span>
                    ) : (
                      <span className="badge badge-pending text-[10px]">
                        <Clock className="w-3 h-3" />
                        Follow-Up
                      </span>
                    )}

                    {status.hasVisitation && (
                      <span className="badge badge-done text-[10px]">
                        <CheckCircle className="w-3 h-3" />
                        Visitation
                      </span>
                    )}

                    {status.onPrayer && (
                      <span className="badge badge-prayer text-[10px]">
                        <Flame className="w-3 h-3 text-purple-600" />
                        Prayer
                      </span>
                    )}

                    {status.needsInfo && (
                      <span className="badge badge-needsinfo text-[10px]">
                        <HelpCircle className="w-3 h-3 text-amber-600" />
                        Needs Info
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--gold)] flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
            </div>
          );
        })}

        {filteredMembers.length === 0 && (
          <div className="col-span-full regal-card p-8 text-center bg-white/70">
            <p className="text-sm text-[var(--muted)]">
              No fold members found matching "{searchQuery}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
