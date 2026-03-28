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
  phoneNumber?: string;
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
  minRank?: string;
  maxRank?: string;
  isRankOpen?: boolean;
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

export interface PlayerMatchHistory {
  id: string;
  player_id: string;
  match_id: string;
  rp_change: number;
  outcome: 'win' | 'loss' | 'draw';
  created_at: string;
  updated_at: string;
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

export interface DBChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  is_system: boolean;
}

export interface ChatMessageWithSender extends DBChatMessage {
  sender_username: string;
  sender_avatar?: string;
}

export interface DBChat {
  id: string;
  match_id: string | null;
  is_dm: boolean;
  created_at: string;
}

export interface DBChatMember {
  chat_id: string;
  user_id: string;
  joined_at: string;
}

export interface DBMatchParticipant {
  match_id: string;
  user_id: string;
  side: 'TL' | 'TR' | 'BL' | 'BR' | null;
  joined_at: string;
}

export interface SendMessageParams {
  chatId: string;
  body: string;
  isSystem?: boolean;
}

export interface ChatMemberInfo {
  userId: string;
  username: string;
  avatar?: string;
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
  matchId?: string;
  participantIds: string[];
  messages: ChatMessage[];
  createdAt: Date;
}
