'use client';

import React, { useState } from 'react';
import { Leader, Member, Submission, PrayerRequest, NeedsInfoItem } from '@/lib/types';
import {
  X,
  Phone,
  MessageSquare,
  Calendar,
  HeartHandshake,
  Home,
  Flame,
  HelpCircle,
  History,
  Send,
  Trash2,
  CheckCircle,
} from 'lucide-react';

interface MemberReportModalProps {
  member: Member;
  currentLeader: Leader;
  periodKey: string;
  prayerList: PrayerRequest[];
  needsInfoList: NeedsInfoItem[];
  allSubmissions: Submission[];
  onClose: () => void;
  onSubmitReport: (payload: any) => Promise<void>;
  onAddPrayerRequest: (payload: any) => Promise<void>;
  onRemovePrayerRequest: (memberName: string) => Promise<void>;
  onAddNeedsInfo: (payload: any) => Promise<void>;
  onRemoveNeedsInfo: (memberName: string) => Promise<void>;
}

export const MemberReportModal: React.FC<MemberReportModalProps> = ({
  member,
  currentLeader,
  periodKey,
  prayerList,
  needsInfoList,
  allSubmissions,
  onClose,
  onSubmitReport,
  onAddPrayerRequest,
  onRemovePrayerRequest,
  onAddNeedsInfo,
  onRemoveNeedsInfo,
}) => {
  const [activeTab, setActiveTab] = useState<'followup' | 'visitation' | 'prayer' | 'needsinfo' | 'history'>('followup');
  const [loading, setLoading] = useState(false);

  // Today's ISO date string (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];

  // Follow-Up form state
  const [fuDate, setFuDate] = useState(todayStr);
  const [fuContext, setFuContext] = useState('Sunday Service');
  const [fuMethod, setFuMethod] = useState('Phone Call');
  const [fuResponse, setFuResponse] = useState('');
  const [fuPrayer, setFuPrayer] = useState('');

  // Visitation form state
  const [visDate, setVisDate] = useState(todayStr);
  const [visReason, setVisReason] = useState('Spiritual Encouragement');
  const [visObservations, setVisObservations] = useState('');
  const [visPrayer, setVisPrayer] = useState('');
  const [visOutcomes, setVisOutcomes] = useState('');

  // Prayer Request state
  const [prayerReason, setPrayerReason] = useState('');

  // Needs Info state
  const [needsInfoReason, setNeedsInfoReason] = useState('');

  // Check if member currently has active prayer item or needs info
  const memName = member.name.trim().toLowerCase();
  const activePrayer = prayerList.find(
    p =>
      p.leaderId === currentLeader.id &&
      p.memberName.trim().toLowerCase() === memName &&
      (p.active === true || p.active === 'true')
  );

  const activeNeedsInfo = needsInfoList.find(
    n =>
      n.leaderId === currentLeader.id &&
      n.memberName.trim().toLowerCase() === memName &&
      (n.active === true || n.active === 'true')
  );

  // Member history submissions
  const memberHistory = allSubmissions.filter(
    s => s.memberName.trim().toLowerCase() === memName
  );

  // Submit Follow-Up
  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmitReport({
        type: 'followup',
        leaderId: currentLeader.id,
        leaderName: currentLeader.name,
        memberId: member.id ? String(member.id) : '',
        memberName: member.name,
        memberPhone: member.phone,
        period: periodKey,
        date: fuDate,
        context: fuContext,
        method: fuMethod,
        response: fuResponse,
        prayerNeeds: fuPrayer,
        submittedAt: new Date().toISOString(),
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // Submit Visitation
  const handleVisitationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmitReport({
        type: 'visitation',
        leaderId: currentLeader.id,
        leaderName: currentLeader.name,
        memberId: member.id ? String(member.id) : '',
        memberName: member.name,
        memberPhone: member.phone,
        period: periodKey,
        date: visDate,
        reason: visReason,
        observations: visObservations,
        prayerNeeds: visPrayer,
        outcomes: visOutcomes,
        submittedAt: new Date().toISOString(),
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // Submit Prayer Request
  const handlePrayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerReason.trim()) return;
    setLoading(true);
    try {
      await onAddPrayerRequest({
        leaderId: currentLeader.id,
        leaderName: currentLeader.name,
        memberName: member.name,
        memberPhone: member.phone,
        reason: prayerReason.trim(),
        addedAt: new Date().toISOString(),
      });
      setPrayerReason('');
    } finally {
      setLoading(false);
    }
  };

  // Submit Needs Info
  const handleNeedsInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!needsInfoReason.trim()) return;
    setLoading(true);
    try {
      await onAddNeedsInfo({
        leaderId: currentLeader.id,
        leaderName: currentLeader.name,
        memberName: member.name,
        memberPhone: member.phone,
        reason: needsInfoReason.trim(),
        addedAt: new Date().toISOString(),
      });
      setNeedsInfoReason('');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map(p => p[0].toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // WhatsApp link format (clean Ghana 050 -> 23350)
  const cleanPhoneForWhatsApp = (p: string) => {
    let cleaned = p.replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = '233' + cleaned.slice(1);
    return cleaned;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#1A1208] to-[#2C1F0A] text-white flex items-center justify-between border-b border-[var(--gold)]/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--gold)] text-[#1A1208] font-bold text-base flex items-center justify-center border-2 border-[var(--gold-light)] shadow-sm">
              {getInitials(member.name)}
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-white leading-tight">
                {member.name}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                {member.phone ? (
                  <>
                    <a
                      href={`tel:${member.phone}`}
                      className="text-xs text-[var(--gold-light)] hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {member.phone}
                    </a>
                    <a
                      href={`https://wa.me/${cleanPhoneForWhatsApp(member.phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      WhatsApp
                    </a>
                  </>
                ) : (
                  <span className="text-xs text-amber-300 italic">No phone on file</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-[var(--border)] bg-[#FAF5EB] px-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('followup')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
              activeTab === 'followup'
                ? 'border-[var(--gold)] text-[var(--deep)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--deep)]'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5 text-[var(--gold)]" />
            <span>Follow-Up</span>
          </button>

          <button
            onClick={() => setActiveTab('visitation')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
              activeTab === 'visitation'
                ? 'border-[var(--gold)] text-[var(--deep)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--deep)]'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-[var(--gold)]" />
            <span>Visitation</span>
          </button>

          <button
            onClick={() => setActiveTab('prayer')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
              activeTab === 'prayer'
                ? 'border-purple-600 text-purple-900'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--deep)]'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-purple-600" />
            <span>Prayer {activePrayer && '•'}</span>
          </button>

          <button
            onClick={() => setActiveTab('needsinfo')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
              activeTab === 'needsinfo'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--deep)]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Needs Info {activeNeedsInfo && '•'}</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-[var(--gold)] text-[var(--deep)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--deep)]'
            }`}
          >
            <History className="w-3.5 h-3.5 text-[var(--muted)]" />
            <span>History ({memberHistory.length})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* TAB 1: FOLLOW-UP */}
          {activeTab === 'followup' && (
            <form onSubmit={handleFollowUpSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--deep)] mb-1">
                    Contact Date
                  </label>
                  <input
                    type="date"
                    value={fuDate}
                    onChange={e => setFuDate(e.target.value)}
                    className="regal-input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--deep)] mb-1">
                    Contact Method
                  </label>
                  <select
                    value={fuMethod}
                    onChange={e => setFuMethod(e.target.value)}
                    className="regal-input text-xs"
                  >
                    <option value="Phone Call">Phone Call</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="In-Person">In-Person</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--deep)] mb-1">
                  Context / Occasion
                </label>
                <select
                  value={fuContext}
                  onChange={e => setFuContext(e.target.value)}
                  className="regal-input text-xs"
                >
                  <option value="Sunday Service">Sunday Service Follow-Up</option>
                  <option value="Midweek Service">Midweek Service Follow-Up</option>
                  <option value="Youth Meeting">Youth Meeting Follow-Up</option>
                  <option value="Personal Check-in">Personal Fold Check-In</option>
                  <option value="Special Program">Special Program / Outreach</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--deep)] mb-1">
                  Member's Response & Current State
                </label>
                <textarea
                  rows={3}
                  placeholder="How is the youth doing? Summary of discussion..."
                  value={fuResponse}
                  onChange={e => setFuResponse(e.target.value)}
                  className="regal-input text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--deep)] mb-1">
                  Prayer Needs / Specific Requests
                </label>
                <textarea
                  rows={2}
                  placeholder="Any prayer requests shared during follow-up..."
                  value={fuPrayer}
                  onChange={e => setFuPrayer(e.target.value)}
                  className="regal-input text-xs resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold px-5 py-2 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? 'Submitting...' : 'Submit Follow-Up Report'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: VISITATION */}
          {activeTab === 'visitation' && (
            <form onSubmit={handleVisitationSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--deep)] mb-1">
                    Visitation Date
                  </label>
                  <input
                    type="date"
                    value={visDate}
                    onChange={e => setVisDate(e.target.value)}
                    className="regal-input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--deep)] mb-1">
                    Primary Reason
                  </label>
                  <select
                    value={visReason}
                    onChange={e => setVisReason(e.target.value)}
                    className="regal-input text-xs"
                  >
                    <option value="Spiritual Encouragement">Spiritual Encouragement</option>
                    <option value="Illness / Hospital">Illness / Hospital</option>
                    <option value="Discipleship">Discipleship & Study</option>
                    <option value="Family Crisis">Family Crisis / Bereavement</option>
                    <option value="Absenteeism">Prolonged Absenteeism</option>
                    <option value="Celebration / Milestone">Celebration / Birthday / Exam</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--deep)] mb-1">
                  Observations / Family Context
                </label>
                <textarea
                  rows={2}
                  placeholder="Key observations during the visit, living environment, openness..."
                  value={visObservations}
                  onChange={e => setVisObservations(e.target.value)}
                  className="regal-input text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--deep)] mb-1">
                  Prayer Needs
                </label>
                <textarea
                  rows={2}
                  placeholder="What did you pray with them for?"
                  value={visPrayer}
                  onChange={e => setVisPrayer(e.target.value)}
                  className="regal-input text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--deep)] mb-1">
                  Outcomes / Next Steps
                </label>
                <textarea
                  rows={2}
                  placeholder="Agreed next steps, upcoming meeting, pastor referral..."
                  value={visOutcomes}
                  onChange={e => setVisOutcomes(e.target.value)}
                  className="regal-input text-xs resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold px-5 py-2 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? 'Submitting...' : 'Log Visitation Report'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: PRAYER REQUEST */}
          {activeTab === 'prayer' && (
            <div className="space-y-4">
              {activePrayer ? (
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-900 flex items-center gap-1">
                      <Flame className="w-4 h-4 text-purple-600" />
                      Active On Ministry Prayer List
                    </span>
                    <span className="text-[10px] text-purple-700">
                      Flagged on {new Date(activePrayer.addedAt).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                  <p className="text-xs text-purple-950 font-medium bg-white/70 p-3 rounded-lg border border-purple-100">
                    "{activePrayer.reason}"
                  </p>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={async () => {
                        setLoading(true);
                        try {
                          await onRemovePrayerRequest(member.name);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      className="px-3 py-1.5 text-xs text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center gap-1.5 transition-colors font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{loading ? 'Removing...' : 'Mark Prayer Answered / Remove'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePrayerSubmit} className="space-y-3">
                  <p className="text-xs text-[var(--muted)]">
                    Add {member.name} to the central ministry prayer list for pastors and leaders to intercede.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--deep)] mb-1">
                      Prayer Need Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Preparing for WASSCE exams, grieving family loss, needs healing..."
                      value={prayerReason}
                      onChange={e => setPrayerReason(e.target.value)}
                      className="regal-input text-xs resize-none"
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading || !prayerReason.trim()}
                      className="btn-gold px-4 py-2 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Flame className="w-3.5 h-3.5 text-[#1A1208]" />
                      <span>{loading ? 'Adding...' : 'Add to Prayer List 🙏'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 4: NEEDS INFO */}
          {activeTab === 'needsinfo' && (
            <div className="space-y-4">
              {activeNeedsInfo ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                      <HelpCircle className="w-4 h-4 text-amber-600" />
                      Flagged — Needs More Info
                    </span>
                    <span className="text-[10px] text-amber-700">
                      Flagged on {new Date(activeNeedsInfo.addedAt).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                  <p className="text-xs text-amber-950 font-medium bg-white/70 p-3 rounded-lg border border-amber-100">
                    "{activeNeedsInfo.reason}"
                  </p>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={async () => {
                        setLoading(true);
                        try {
                          await onRemoveNeedsInfo(member.name);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      className="px-3 py-1.5 text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors font-medium"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{loading ? 'Updating...' : 'Mark Info Complete'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleNeedsInfoSubmit} className="space-y-3">
                  <p className="text-xs text-[var(--muted)]">
                    Flag this member if their phone number is incorrect, location unknown, or details need updating.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--deep)] mb-1">
                      What Information Is Needed?
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Phone number switches off, need residence location, need parent's contact..."
                      value={needsInfoReason}
                      onChange={e => setNeedsInfoReason(e.target.value)}
                      className="regal-input text-xs resize-none"
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading || !needsInfoReason.trim()}
                      className="btn-gold px-4 py-2 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-[#1A1208]" />
                      <span>{loading ? 'Flagging...' : 'Flag as Needs Info ❓'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 5: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {memberHistory.length > 0 ? (
                memberHistory.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-[var(--border-light)] bg-[#FFFDF9] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`badge ${
                            s.type === 'visitation'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'badge-done'
                          }`}
                        >
                          {s.type === 'visitation' ? 'Home Visit' : 'Follow-Up'}
                        </span>
                        <span className="text-[11px] text-[var(--muted)] font-mono">
                          Period {s.period}
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--muted)]">
                        {s.date || new Date(s.submittedAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>

                    {s.type === 'followup' ? (
                      <div className="space-y-1">
                        <p className="text-[var(--text2)]">
                          <strong className="text-[var(--deep)]">Method:</strong> {s.method} ({s.context})
                        </p>
                        {s.response && (
                          <p className="text-[var(--text2)] bg-[var(--gold-pale)] p-2 rounded border border-[var(--border-light)]">
                            "{s.response}"
                          </p>
                        )}
                        {s.prayerNeeds && (
                          <p className="text-purple-900 text-[11px]">
                            <strong>Prayer:</strong> {s.prayerNeeds}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-[var(--text2)]">
                          <strong className="text-[var(--deep)]">Reason:</strong> {s.reason}
                        </p>
                        {s.observations && (
                          <p className="text-[var(--text2)] bg-[var(--gold-pale)] p-2 rounded border border-[var(--border-light)]">
                            <strong>Observations:</strong> {s.observations}
                          </p>
                        )}
                        {s.outcomes && (
                          <p className="text-[var(--text2)]">
                            <strong>Outcomes:</strong> {s.outcomes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-[var(--muted)]">
                  No historical reports recorded yet for this member.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
