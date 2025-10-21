import AsyncStorage from '@react-native-async-storage/async-storage';
import { Match } from '@/types';
import { getRankFromPoints, Rank } from '@/constants/ranks';
import { FIELDS, MoroccoCity } from '@/constants/cities';

const MOCK_DATA_KEY = '@mock_data';
const MOCK_AUTH_KEY = '@mock_auth';
const MOCK_MODE_KEY = '@mock_mode_enabled';

export interface MockUser {
  id: string;
  email: string;
  password: string;
  username: string;
  phoneNumber?: string;
  city: MoroccoCity;
  rank: Rank;
  wins: number;
  losses: number;
  reputation: number;
  level: number;
  profilePicture?: string;
  createdAt: string;
}

export interface MockMatch extends Omit<Match, 'host' | 'players'> {
  hostId: string;
  playerIds: string[];
}

export interface MockData {
  users: MockUser[];
  matches: MockMatch[];
  matchPlayers: { matchId: string; userId: string }[];
  currentUserId: string | null;
}

const DEFAULT_MOCK_USERS: MockUser[] = [
  {
    id: 'user-1',
    email: 'shadow@test.com',
    password: 'password',
    username: 'ShadowStrike',
    city: 'CASABLANCA',
    rank: getRankFromPoints(3850),
    wins: 147,
    losses: 89,
    reputation: 4.8,
    level: 42,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-2',
    email: 'phoenix@test.com',
    password: 'password',
    username: 'PhoenixAce',
    city: 'RABAT',
    rank: getRankFromPoints(3200),
    wins: 201,
    losses: 112,
    reputation: 4.6,
    level: 38,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-3',
    email: 'vortex@test.com',
    password: 'password',
    username: 'VortexKing',
    city: 'CASABLANCA',
    rank: getRankFromPoints(2750),
    wins: 98,
    losses: 72,
    reputation: 4.7,
    level: 35,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-4',
    email: 'nova@test.com',
    password: 'password',
    username: 'NovaBlaze',
    city: 'MARRAKECH',
    rank: getRankFromPoints(2450),
    wins: 156,
    losses: 98,
    reputation: 4.5,
    level: 31,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-5',
    email: 'titan@test.com',
    password: 'password',
    username: 'TitanCrush',
    city: 'CASABLANCA',
    rank: getRankFromPoints(1890),
    wins: 89,
    losses: 67,
    reputation: 4.3,
    level: 28,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_MOCK_MATCHES: MockMatch[] = [
  {
    id: 'match-1',
    type: 'official',
    status: 'waiting',
    hostId: 'user-1',
    playerIds: ['user-1', 'user-2'],
    maxPlayers: 4,
    field: FIELDS[0],
    pointReward: 50,
    pointPenalty: 30,
    createdAt: new Date(),
  },
  {
    id: 'match-2',
    type: 'friendly',
    status: 'waiting',
    hostId: 'user-3',
    playerIds: ['user-3'],
    maxPlayers: 4,
    field: FIELDS[1],
    pointReward: 25,
    pointPenalty: 15,
    createdAt: new Date(),
  },
];

class MockDataProvider {
  private data: MockData | null = null;

  async initialize(): Promise<void> {
    const stored = await AsyncStorage.getItem(MOCK_DATA_KEY);
    if (stored) {
      this.data = JSON.parse(stored);
    } else {
      this.data = {
        users: DEFAULT_MOCK_USERS,
        matches: DEFAULT_MOCK_MATCHES,
        matchPlayers: [
          { matchId: 'match-1', userId: 'user-1' },
          { matchId: 'match-1', userId: 'user-2' },
          { matchId: 'match-2', userId: 'user-3' },
        ],
        currentUserId: null,
      };
      await this.save();
    }
  }

  private async save(): Promise<void> {
    if (this.data) {
      await AsyncStorage.setItem(MOCK_DATA_KEY, JSON.stringify(this.data));
    }
  }

  async isMockModeEnabled(): Promise<boolean> {
    const enabled = await AsyncStorage.getItem(MOCK_MODE_KEY);
    return enabled === 'true';
  }

  async setMockMode(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(MOCK_MODE_KEY, enabled ? 'true' : 'false');
  }

  async reset(): Promise<void> {
    this.data = {
      users: DEFAULT_MOCK_USERS,
      matches: DEFAULT_MOCK_MATCHES,
      matchPlayers: [
        { matchId: 'match-1', userId: 'user-1' },
        { matchId: 'match-1', userId: 'user-2' },
        { matchId: 'match-2', userId: 'user-3' },
      ],
      currentUserId: null,
    };
    await this.save();
    await AsyncStorage.removeItem(MOCK_AUTH_KEY);
  }

  async signup(email: string, password: string, username: string, phoneNumber?: string): Promise<MockUser> {
    if (!this.data) await this.initialize();

    const existingUser = this.data!.users.find((u) => u.email === email);
    if (existingUser) {
      throw new Error('Email already in use');
    }

    const newUser: MockUser = {
      id: `user-${Date.now()}`,
      email,
      password,
      username,
      phoneNumber,
      city: 'CASABLANCA',
      rank: getRankFromPoints(0),
      wins: 0,
      losses: 0,
      reputation: 5.0,
      level: 1,
      createdAt: new Date().toISOString(),
    };

    this.data!.users.push(newUser);
    await this.save();
    return newUser;
  }

  async login(email: string, password: string): Promise<MockUser> {
    if (!this.data) await this.initialize();

    const user = this.data!.users.find((u) => u.email === email && u.password === password);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    this.data!.currentUserId = user.id;
    await this.save();
    await AsyncStorage.setItem(MOCK_AUTH_KEY, user.id);
    return user;
  }

  async logout(): Promise<void> {
    if (!this.data) await this.initialize();
    this.data!.currentUserId = null;
    await this.save();
    await AsyncStorage.removeItem(MOCK_AUTH_KEY);
  }

  async getCurrentUser(): Promise<MockUser | null> {
    if (!this.data) await this.initialize();

    const storedUserId = await AsyncStorage.getItem(MOCK_AUTH_KEY);
    if (!storedUserId) return null;

    const user = this.data!.users.find((u) => u.id === storedUserId);
    return user || null;
  }

  async getUser(userId: string): Promise<MockUser | null> {
    if (!this.data) await this.initialize();
    const user = this.data!.users.find((u) => u.id === userId);
    return user || null;
  }

  async updateUser(userId: string, updates: Partial<MockUser>): Promise<void> {
    if (!this.data) await this.initialize();

    const userIndex = this.data!.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');

    this.data!.users[userIndex] = { ...this.data!.users[userIndex], ...updates };
    await this.save();
  }

  async getAllUsers(): Promise<MockUser[]> {
    if (!this.data) await this.initialize();
    return this.data!.users;
  }

  async createMatch(hostId: string, matchData: Partial<MockMatch>): Promise<MockMatch> {
    if (!this.data) await this.initialize();

    const newMatch: MockMatch = {
      id: `match-${Date.now()}`,
      type: matchData.type || 'friendly',
      status: 'waiting',
      hostId,
      playerIds: [hostId],
      maxPlayers: matchData.maxPlayers || 4,
      field: matchData.field || FIELDS[0],
      pointReward: matchData.pointReward || 25,
      pointPenalty: matchData.pointPenalty || 15,
      createdAt: new Date(),
      ...matchData,
    };

    this.data!.matches.push(newMatch);
    this.data!.matchPlayers.push({ matchId: newMatch.id, userId: hostId });
    await this.save();
    return newMatch;
  }

  async getMatch(matchId: string): Promise<MockMatch | null> {
    if (!this.data) await this.initialize();
    const match = this.data!.matches.find((m) => m.id === matchId);
    return match || null;
  }

  async getAllMatches(): Promise<MockMatch[]> {
    if (!this.data) await this.initialize();
    return this.data!.matches;
  }

  async joinMatch(matchId: string, userId: string): Promise<void> {
    if (!this.data) await this.initialize();

    const match = this.data!.matches.find((m) => m.id === matchId);
    if (!match) throw new Error('Match not found');

    if (match.playerIds.includes(userId)) {
      throw new Error('Already in match');
    }

    if (match.playerIds.length >= match.maxPlayers) {
      throw new Error('Match is full');
    }

    match.playerIds.push(userId);
    this.data!.matchPlayers.push({ matchId, userId });
    await this.save();
  }

  async leaveMatch(matchId: string, userId: string): Promise<void> {
    if (!this.data) await this.initialize();

    const match = this.data!.matches.find((m) => m.id === matchId);
    if (!match) throw new Error('Match not found');

    match.playerIds = match.playerIds.filter((id) => id !== userId);
    this.data!.matchPlayers = this.data!.matchPlayers.filter(
      (mp) => !(mp.matchId === matchId && mp.userId === userId)
    );
    await this.save();
  }

  async getMatchPlayers(matchId: string): Promise<MockUser[]> {
    if (!this.data) await this.initialize();

    const playerEntries = this.data!.matchPlayers.filter((mp) => mp.matchId === matchId);
    const players: MockUser[] = [];

    for (const entry of playerEntries) {
      const user = await this.getUser(entry.userId);
      if (user) players.push(user);
    }

    return players;
  }

  async findOpenMatch(tier: string): Promise<MockMatch | null> {
    if (!this.data) await this.initialize();

    const openMatches = this.data!.matches.filter(
      (m) => m.status === 'waiting' && m.playerIds.length < m.maxPlayers
    );

    return openMatches[0] || null;
  }
}

export const mockDataProvider = new MockDataProvider();
