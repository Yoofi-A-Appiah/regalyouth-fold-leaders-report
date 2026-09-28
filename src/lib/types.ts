export interface Member {
  id?: number;
  leaderId?: string;
  name: string;
  phone: string;
  addedAt?: string;
}

export interface Leader {
  id: string;
  name: string;
  addedAt?: string;
  members: Member[];
}

export interface FollowUpSubmission {
  id?: number;
  submittedAt: string;
  period: string;
  leaderId: string;
  leaderName: string;
  memberId?: string;
  memberName: string;
  memberPhone?: string;
  date: string;
  context: string;
  method: string;
  response?: string;
  prayerNeeds?: string;
  type: 'followup';
}

export interface VisitationSubmission {
  id?: number;
  submittedAt: string;
  period: string;
  leaderId: string;
  leaderName: string;
  memberId?: string;
  memberName: string;
  memberPhone?: string;
  date: string;
  reason: string;
  observations?: string;
  prayerNeeds?: string;
  outcomes?: string;
  type: 'visitation';
}

export type Submission = FollowUpSubmission | VisitationSubmission;

export interface PrayerRequest {
  id?: number;
  addedAt: string;
  leaderId: string;
  leaderName: string;
  memberName: string;
  memberPhone?: string;
  reason: string;
  active: boolean | string;
}

export interface NeedsInfoItem {
  id?: number;
  addedAt: string;
  leaderId: string;
  leaderName: string;
  memberName: string;
  memberPhone?: string;
  reason: string;
  active: boolean | string;
}

export interface EventItem {
  id: string;
  name: string;
  type: string;
  date: string;
  createdAt: string;
  createdBy?: string;
}

export interface AttendanceRecord {
  id?: number;
  markedAt: string;
  eventId: string;
  eventName: string;
  leaderId: string;
  leaderName: string;
  memberName: string;
  present: boolean;
}

export interface AdminStats {
  totalSubmissions: number;
  thisPeriodSubmissions: number;
  leaderCounts: Record<string, number>;
  recentSubmissions: Submission[];
}
