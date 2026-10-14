'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Leader,
  Member,
  Submission,
  PrayerRequest,
  NeedsInfoItem,
  EventItem,
  AdminStats,
  AttendanceRecord,
  ExecResource,
} from '@/lib/types';
import { currentPeriodKey } from '@/lib/period';
import { Header } from '@/components/Header';
import { LoginScreen } from '@/components/LoginScreen';
import { DashboardScreen } from '@/components/DashboardScreen';
import { MemberReportModal } from '@/components/MemberReportModal';
import { AttendanceScreen } from '@/components/AttendanceScreen';
import { ExecutiveScreen } from '@/components/ExecutiveScreen';
import { AdminPortal } from '@/components/AdminPortal';
import { BottomNav } from '@/components/BottomNav';
import { Toast, ToastMessage } from '@/components/Toast';

export default function Home() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [unassigned, setUnassigned] = useState<Member[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [prayerList, setPrayerList] = useState<PrayerRequest[]>([]);
  const [needsInfoList, setNeedsInfoList] = useState<NeedsInfoItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [resources, setResources] = useState<ExecResource[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);

  const [currentLeader, setCurrentLeader] = useState<Leader | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'login' | 'dashboard' | 'attendance' | 'executive' | 'admin'>('login');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Admin access comes from either the shared passcode (isAdmin, no fold attached) or
  // being a fold leader flagged as Fold Coordinator / Super Admin (keeps their own fold).
  const hasAdminAccess = isAdmin || !!currentLeader?.isFoldCoordinator || !!currentLeader?.isSuperAdmin;

  const [neonMode, setNeonMode] = useState<'neon' | 'in-memory' | 'checking'>('checking');
  const [periodKey, setPeriodKey] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  // Toast Helper
  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Check MongoDB connection and fetch data
  const loadAllData = useCallback(async () => {
    try {
      // 1. Setup / health check
      const setupRes = await fetch('/api/setup');
      const setupData = await setupRes.json();
      setNeonMode(setupData.mode === 'mongodb' ? 'neon' : 'in-memory');

      // 2. Fetch Roster
      const rosterRes = await fetch('/api/roster');
      const rosterData = await rosterRes.json();
      if (rosterData.leaders) {
        setLeaders(rosterData.leaders);
        setUnassigned(rosterData.unassigned || []);
      }

      // 3. Fetch Submissions
      const subRes = await fetch('/api/submissions');
      const subData = await subRes.json();
      if (subData.submissions) setSubmissions(subData.submissions);

      // 4. Fetch Prayer List
      const prayerRes = await fetch('/api/prayer');
      const prayerData = await prayerRes.json();
      if (prayerData.prayerList) setPrayerList(prayerData.prayerList);

      // 5. Fetch Needs Info
      const needsRes = await fetch('/api/needs-info');
      const needsData = await needsRes.json();
      if (needsData.needsInfoList) setNeedsInfoList(needsData.needsInfoList);

      // 6. Fetch Events
      const eventsRes = await fetch('/api/events');
      const eventsData = await eventsRes.json();
      if (eventsData.events) setEvents(eventsData.events);

      // 6b. Fetch full Attendance history (for admin analytics -- follow-up vs. attendance)
      const attRes = await fetch('/api/attendance');
      const attData = await attRes.json();
      if (attData.attendance) setAttendance(attData.attendance);

      // 6c. Fetch Youth Executive resources (Google Docs/Sheets links)
      const resRes = await fetch('/api/resources');
      const resData = await resRes.json();
      if (resData.resources) setResources(resData.resources);

      // 7. Fetch Admin Stats
      const statsRes = await fetch('/api/admin/stats');
      const statsData = await statsRes.json();
      setStats(statsData);
    } catch (err: any) {
      console.error('Error loading data:', err);
      showToast('Offline or initial load error. Using local cached data.', 'info');
    } finally {
      setInitialLoading(false);
    }
  }, [showToast]);

  // Initial mount
  useEffect(() => {
    setPeriodKey(currentPeriodKey());
    loadAllData();

    // Check saved session in localStorage
    try {
      const savedLeader = localStorage.getItem('rym_current_leader');
      if (savedLeader) {
        const parsed = JSON.parse(savedLeader);
        setCurrentLeader(parsed);
        setCurrentScreen('dashboard');
      }
      const savedAdmin = localStorage.getItem('rym_is_admin');
      if (savedAdmin === 'true') {
        setIsAdmin(true);
        setCurrentScreen('admin');
      }
    } catch {}
  }, [loadAllData]);

  // Keep currentLeader's member list in sync when leaders data changes
  useEffect(() => {
    if (currentLeader && leaders.length > 0) {
      const refreshed = leaders.find(l => l.id === currentLeader.id);
      if (refreshed) {
        setCurrentLeader(refreshed);
      }
    }
  }, [leaders, currentLeader?.id]);

  // Login as Leader
  const handleLoginLeader = (leader: Leader) => {
    setCurrentLeader(leader);
    setIsAdmin(false);
    setCurrentScreen('dashboard');
    try {
      localStorage.setItem('rym_current_leader', JSON.stringify(leader));
      localStorage.removeItem('rym_is_admin');
    } catch {}
    showToast(`Welcome, ${leader.name}!`, 'success');
  };

  // Login as Admin
  const handleLoginAdmin = () => {
    setIsAdmin(true);
    setCurrentLeader(null);
    setCurrentScreen('admin');
    try {
      localStorage.setItem('rym_is_admin', 'true');
      localStorage.removeItem('rym_current_leader');
    } catch {}
    showToast('Signed in as Administrator 🛡️', 'success');
  };

  // Logout / Switch
  const handleLogout = () => {
    setCurrentLeader(null);
    setIsAdmin(false);
    setCurrentScreen('login');
    setSelectedMember(null);
    try {
      localStorage.removeItem('rym_current_leader');
      localStorage.removeItem('rym_is_admin');
    } catch {}
    showToast('Signed out successfully', 'info');
  };

  // Submit Follow-Up or Visitation Report
  const handleSubmitReport = async (payload: any) => {
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit report');

      // Optimistic update
      setSubmissions(prev => [payload, ...prev]);
      showToast(
        payload.type === 'visitation'
          ? 'Home visitation report logged! 🏡'
          : 'Follow-up report submitted',
        'success'
      );
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Submission failed', 'error');
      throw err;
    }
  };

  // Add Prayer Request
  const handleAddPrayerRequest = async (payload: any) => {
    try {
      const res = await fetch('/api/prayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add prayer request');

      setPrayerList(prev => [
        { ...payload, active: true, id: Date.now() },
        ...prev.filter(
          p =>
            !(
              p.leaderId === payload.leaderId &&
              p.memberName.toLowerCase() === payload.memberName.toLowerCase()
            )
        ),
      ]);
      showToast('Added to ministry prayer list 🙏', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add prayer request', 'error');
      throw err;
    }
  };

  // Remove Prayer Request
  const handleRemovePrayerRequest = async (memberName: string) => {
    if (!currentLeader) return;
    try {
      const res = await fetch('/api/prayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'removePrayerRequest',
          leaderId: currentLeader.id,
          memberName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove prayer request');

      setPrayerList(prev =>
        prev.filter(
          p =>
            !(
              p.leaderId === currentLeader.id &&
              p.memberName.toLowerCase() === memberName.toLowerCase()
            )
        )
      );
      showToast('Removed from prayer list', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove prayer request', 'error');
      throw err;
    }
  };

  // Add Needs Info
  const handleAddNeedsInfo = async (payload: any) => {
    try {
      const res = await fetch('/api/needs-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to flag needs info');

      setNeedsInfoList(prev => [
        { ...payload, active: true, id: Date.now() },
        ...prev.filter(
          n =>
            !(
              n.leaderId === payload.leaderId &&
              n.memberName.toLowerCase() === payload.memberName.toLowerCase()
            )
        ),
      ]);
      showToast('Member flagged for follow-up details ❓', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to flag needs info', 'error');
      throw err;
    }
  };

  // Remove Needs Info
  const handleRemoveNeedsInfo = async (memberName: string) => {
    if (!currentLeader) return;
    try {
      const res = await fetch('/api/needs-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'removeNeedsInfo',
          leaderId: currentLeader.id,
          memberName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove flag');

      setNeedsInfoList(prev =>
        prev.filter(
          n =>
            !(
              n.leaderId === currentLeader.id &&
              n.memberName.toLowerCase() === memberName.toLowerCase()
            )
        )
      );
      showToast('Marked member info complete', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to update', 'error');
      throw err;
    }
  };

  // Submit Attendance
  const handleSubmitAttendance = async (payload: any) => {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit attendance');
      showToast('Attendance recorded successfully! ✅', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit attendance', 'error');
      throw err;
    }
  };

  // Fetch Attendance for an event -- omit leaderId to get every fold's records (admin mode)
  const fetchEventAttendance = async (eventId: string, leaderId?: string) => {
    const url = leaderId
      ? `/api/attendance?eventId=${eventId}&leaderId=${leaderId}`
      : `/api/attendance?eventId=${eventId}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.attendance || [];
  };

  // Admin Actions
  const handleAddLeader = async (payload: { id: string; name: string }) => {
    try {
      const res = await fetch('/api/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addLeader', ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add leader');
      showToast(`Leader ${payload.name} added! 🎉`, 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to add leader', 'error');
      throw err;
    }
  };

  const handleAddMember = async (payload: { name: string; phone?: string; leaderId?: string }) => {
    try {
      const res = await fetch('/api/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addMember', ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add member');
      showToast(`Member ${payload.name} added!`, 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to add member', 'error');
      throw err;
    }
  };

  const handleAssignMember = async (payload: { memberName: string; fromLeaderId?: string; toLeaderId?: string }) => {
    try {
      const res = await fetch('/api/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assignMember', ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign member');
      showToast(`Member ${payload.memberName} reassigned`, 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to assign member', 'error');
      throw err;
    }
  };

  const handleRemoveMember = async (payload: { memberName: string; leaderId?: string }) => {
    if (!confirm(`Are you sure you want to remove ${payload.memberName}?`)) return;
    try {
      const res = await fetch('/api/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'removeMember', ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove member');
      showToast(`Member ${payload.memberName} removed`, 'info');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove member', 'error');
      throw err;
    }
  };

  const handleAddEvent = async (payload: { name: string; type?: string; date: string }) => {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create event');
      showToast(`Event "${payload.name}" published`, 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create event', 'error');
      throw err;
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteEvent', eventId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete event');
      showToast('Event deleted', 'info');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete event', 'error');
      throw err;
    }
  };

  const handleSetFoldCoordinator = async (payload: { leaderId: string; isFoldCoordinator: boolean }) => {
    try {
      const res = await fetch('/api/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setFoldCoordinator', ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update fold coordinator status');
      showToast(payload.isFoldCoordinator ? 'Marked as Fold Coordinator' : 'Removed as Fold Coordinator', 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update fold coordinator status', 'error');
      throw err;
    }
  };

  const handleSetExecutive = async (payload: { leaderId: string; isExecutive: boolean }) => {
    try {
      const res = await fetch('/api/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setExecutive', ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update executive status');
      showToast(payload.isExecutive ? 'Marked as Youth Executive' : 'Removed as Youth Executive', 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update executive status', 'error');
      throw err;
    }
  };

  const handleAddResource = async (payload: { title: string; url: string }) => {
    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add resource');
      showToast(`"${payload.title}" added`, 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to add resource', 'error');
      throw err;
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm('Remove this resource from the Executive tab?')) return;
    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteResource', id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove resource');
      showToast('Resource removed', 'info');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove resource', 'error');
      throw err;
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-16 sm:pb-20">
      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Global Header */}
      <Header
        currentLeader={currentLeader}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {initialLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-[var(--gold)] border-t-transparent animate-spin" />
            <p className="font-serif text-sm font-semibold text-[var(--deep)]">
              Loading Regal Youth Ministry Fold System...
            </p>
          </div>
        ) : currentScreen === 'login' ? (
          <LoginScreen
            leaders={leaders}
            onLoginLeader={handleLoginLeader}
            onLoginAdmin={handleLoginAdmin}
          />
        ) : currentScreen === 'dashboard' && currentLeader ? (
          <DashboardScreen
            currentLeader={currentLeader}
            periodKey={periodKey}
            submissions={submissions}
            prayerList={prayerList}
            needsInfoList={needsInfoList}
            onSelectMember={member => setSelectedMember(member)}
            onOpenAttendance={() => setCurrentScreen('attendance')}
          />
        ) : currentScreen === 'attendance' && hasAdminAccess ? (
          <AttendanceScreen
            mode="all"
            leaders={leaders}
            unassigned={unassigned}
            events={events}
            onBack={() => setCurrentScreen(currentLeader ? 'dashboard' : 'admin')}
            onSubmitAttendance={handleSubmitAttendance}
            fetchEventAttendance={fetchEventAttendance}
          />
        ) : currentScreen === 'attendance' && currentLeader ? (
          <AttendanceScreen
            mode="fold"
            currentLeader={currentLeader}
            events={events}
            onBack={() => setCurrentScreen('dashboard')}
            onSubmitAttendance={handleSubmitAttendance}
            fetchEventAttendance={fetchEventAttendance}
          />
        ) : currentScreen === 'executive' && currentLeader && (currentLeader.isExecutive || currentLeader.isSuperAdmin) ? (
          <ExecutiveScreen resources={resources} />
        ) : currentScreen === 'admin' && hasAdminAccess ? (
          <AdminPortal
            stats={stats}
            leaders={leaders}
            unassigned={unassigned}
            events={events}
            attendance={attendance}
            resources={resources}
            isSuperAdmin={!!currentLeader?.isSuperAdmin}
            submissions={submissions}
            prayerList={prayerList}
            needsInfoList={needsInfoList}
            neonMode={neonMode}
            onAddLeader={handleAddLeader}
            onAddMember={handleAddMember}
            onAssignMember={handleAssignMember}
            onRemoveMember={handleRemoveMember}
            onAddEvent={handleAddEvent}
            onDeleteEvent={handleDeleteEvent}
            onSetExecutive={handleSetExecutive}
            onSetFoldCoordinator={handleSetFoldCoordinator}
            onAddResource={handleAddResource}
            onDeleteResource={handleDeleteResource}
            onRefreshData={loadAllData}
          />
        ) : (
          <LoginScreen
            leaders={leaders}
            onLoginLeader={handleLoginLeader}
            onLoginAdmin={handleLoginAdmin}
          />
        )}
      </main>

      {/* Member Report Modal */}
      {selectedMember && currentLeader && (
        <MemberReportModal
          member={selectedMember}
          currentLeader={currentLeader}
          periodKey={periodKey}
          prayerList={prayerList}
          needsInfoList={needsInfoList}
          allSubmissions={submissions}
          onClose={() => setSelectedMember(null)}
          onSubmitReport={handleSubmitReport}
          onAddPrayerRequest={handleAddPrayerRequest}
          onRemovePrayerRequest={handleRemovePrayerRequest}
          onAddNeedsInfo={handleAddNeedsInfo}
          onRemoveNeedsInfo={handleRemoveNeedsInfo}
        />
      )}

      {/* Mobile Bottom Navigation */}
      {currentScreen !== 'login' && (
        <BottomNav
          currentScreen={
            currentScreen === 'admin' || currentScreen === 'attendance' || currentScreen === 'executive'
              ? currentScreen
              : 'dashboard'
          }
          hasFold={!!currentLeader}
          isAdmin={hasAdminAccess}
          isExecutive={!!currentLeader?.isExecutive || !!currentLeader?.isSuperAdmin}
          onNavigate={screen => {
            if (screen === 'admin') {
              // BottomNav only renders this tab when hasAdminAccess is already true.
              if (hasAdminAccess) setCurrentScreen('admin');
            } else if (screen === 'executive') {
              // BottomNav only renders this tab when the flag is already true.
              if (currentLeader?.isExecutive || currentLeader?.isSuperAdmin) setCurrentScreen('executive');
            } else if (screen === 'dashboard') {
              if (currentLeader) setCurrentScreen('dashboard');
            } else if (screen === 'attendance') {
              // Admin (any route) marks attendance across every fold; a fold leader marks just their own.
              if (hasAdminAccess || currentLeader) setCurrentScreen('attendance');
            }
          }}
        />
      )}
    </div>
  );
}
