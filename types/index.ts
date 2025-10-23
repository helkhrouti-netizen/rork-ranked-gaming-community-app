import { Rank } from '@/constants/ranks';
import { MoroccoCity, Field } from '@/constants/cities';

export type MatchType = 'official' | 'friendly';
export type MatchStatus = 'waiting' | 'in_progress' | 'completed' | 'pending_validation' | 'disputed';
export type ScoreSubmissionStatus = 'pending' | 'submitted' | 'validated' | 'disputed';
export type CourtPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface Player {
  id: string;
  username: string;
  rank: Rank;
  avatar?: string;
  city: MoroccoCity;
  wins: number;
  losses: number;
  reputation: number;
  level: number;
  preferredSide?: CourtPosition;
}

export interface MatchPlayerPosition {
  playerId: string;
  position: CourtPosition;
}

export interface Match {
  id: string;
  type: MatchType;
  status: MatchStatus;
  host: Player;
  players: Player[];
  maxPlayers: number;
  field: Field;
  scheduledTime?: Date;
  pointReward: number;
  pointPenalty: number;
  createdAt: Date;
  playerPositions: MatchPlayerPosition[];
  chatRoomId: string;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  prizePool: number;
  participants: number;
  maxParticipants: number;
  entryFee: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  minRank: Rank;
}

export interface MatchHistory {
  id: string;
  match: Match;
  result: 'win' | 'loss' | 'draw';
  pointsChange: number;
  date: Date;
}

export interface PlayerRating {
  id: string;
  matchId: string;
  ratedBy: string;
  ratedPlayer: string;
  stars: number;
  comment?: string;
  createdAt: Date;
}

export interface ScoreSubmission {
  playerId: string;
  playerName: string;
  team1Score: number;
  team2Score: number;
  submittedAt: Date;
}

export interface MatchResult {
  matchId: string;
  team1: Player[];
  team2: Player[];
  team1Score: number;
  team2Score: number;
  status: ScoreSubmissionStatus;
  submissions: ScoreSubmission[];
  validatedAt?: Date;
  disputedReason?: string;
  ratingsRequired: boolean;
  ratingsSubmitted: string[];
}

export interface PlayerReport {
  id: string;
  matchId: string;
  reportedBy: string;
  reportedPlayer: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: Date;
}

export interface PlayerReputation {
  playerId: string;
  averageRating: number;
  totalRatings: number;
  reportCount: number;
  suspensionUntil?: Date;
  isBanned: boolean;
  badges: string[];
}

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

export interface ChatRoom {
  id: string;
  matchId: string;
  participantIds: string[];
  messages: ChatMessage[];
  createdAt: Date;
}

export interface PrivateChat {
  id: string;
  participant1Id: string;
  participant2Id: string;
  messages: ChatMessage[];
  createdAt: Date;
}
