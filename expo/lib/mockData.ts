import AsyncStorage from '@react-native-async-storage/async-storage';
import { Match, CourtPosition, ChatMessage, ChatRoom } from '@/types';
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
  preferredSide?: CourtPosition;
  createdAt: string;
}

export interface MockMatch extends Omit<Match, 'host' | 'players'> {
  hostId: string;
  playerIds: string[];
  playerPositions: { playerId: string; position: CourtPosition }[];
  chatRoomId: string;
  minRank?: string;
  maxRank?: string;
  isRankOpen?: boolean;
}

export interface MockData {
  users: MockUser[];
  matches: MockMatch[];
  matchPlayers: { matchId: string; userId: string }[];
  chatRooms: ChatRoom[];
  currentUserId: string | null;
}

const cities: MoroccoCity[] = ['CASABLANCA', 'RABAT', 'MARRAKECH', 'FES', 'TANGER', 'AGADIR'];

function getRandomCity(): MoroccoCity {
  return cities[Math.floor(Math.random() * cities.length)];
}

function getRandomWinsLosses(tier: string): [number, number] {
  const ranges = {
    'Cuivre': { min: 5, max: 40 },
    'Silver': { min: 30, max: 80 },
    'Gold': { min: 70, max: 150 },
    'Platinum': { min: 120, max: 250 },
  }[tier] || { min: 5, max: 40 };

  const wins = Math.floor(Math.random() * (ranges.max - ranges.min + 1)) + ranges.min;
  const losses = Math.floor(wins * (0.3 + Math.random() * 0.5));
  return [wins, losses];
}

const DEFAULT_MOCK_USERS: MockUser[] = [
  { id: 'u-01', email: 'shadow@test.com', password: 'password', username: 'ShadowStrike', phoneNumber: '+212 6 12 34 56 78', city: getRandomCity(), rank: getRankFromPoints(950), ...getWinsLosses(950) },
  { id: 'u-02', email: 'phoenix@test.com', password: 'password', username: 'PhoenixAce', phoneNumber: '+212 6 23 45 67 89', city: getRandomCity(), rank: getRankFromPoints(1020), ...getWinsLosses(1020) },
  { id: 'u-03', email: 'vortex@test.com', password: 'password', username: 'VortexKing', phoneNumber: '+212 6 34 56 78 90', city: getRandomCity(), rank: getRankFromPoints(880), ...getWinsLosses(880) },
  { id: 'u-04', email: 'nova@test.com', password: 'password', username: 'NovaBlaze', city: getRandomCity(), rank: getRankFromPoints(790), ...getWinsLosses(790) },
  { id: 'u-05', email: 'titan@test.com', password: 'password', username: 'TitanCrush', city: getRandomCity(), rank: getRankFromPoints(840), ...getWinsLosses(840) },
  { id: 'u-06', email: 'bolt@test.com', password: 'password', username: 'BoltRacer', city: getRandomCity(), rank: getRankFromPoints(920), ...getWinsLosses(920) },
  { id: 'u-07', email: 'echo@test.com', password: 'password', username: 'EchoWave', city: getRandomCity(), rank: getRankFromPoints(770), ...getWinsLosses(770) },
  { id: 'u-08', email: 'raven@test.com', password: 'password', username: 'RavenClaw', city: getRandomCity(), rank: getRankFromPoints(810), ...getWinsLosses(810) },
  { id: 'u-09', email: 'storm@test.com', password: 'password', username: 'StormBreaker', city: getRandomCity(), rank: getRankFromPoints(980), ...getWinsLosses(980) },
  { id: 'u-10', email: 'frost@test.com', password: 'password', username: 'FrostByte', city: getRandomCity(), rank: getRankFromPoints(860), ...getWinsLosses(860) },
  { id: 'u-11', email: 'blaze@test.com', password: 'password', username: 'BlazeRunner', city: getRandomCity(), rank: getRankFromPoints(680), ...getWinsLosses(680) },
  { id: 'u-12', email: 'thunder@test.com', password: 'password', username: 'ThunderBolt', city: getRandomCity(), rank: getRankFromPoints(640), ...getWinsLosses(640) },
  { id: 'u-13', email: 'crystal@test.com', password: 'password', username: 'CrystalEdge', city: getRandomCity(), rank: getRankFromPoints(590), ...getWinsLosses(590) },
  { id: 'u-14', email: 'lunar@test.com', password: 'password', username: 'LunarFlare', city: getRandomCity(), rank: getRankFromPoints(710), ...getWinsLosses(710) },
  { id: 'u-15', email: 'solar@test.com', password: 'password', username: 'SolarWind', city: getRandomCity(), rank: getRankFromPoints(620), ...getWinsLosses(620) },
  { id: 'u-16', email: 'crimson@test.com', password: 'password', username: 'CrimsonFury', city: getRandomCity(), rank: getRankFromPoints(550), ...getWinsLosses(550) },
  { id: 'u-17', email: 'azure@test.com', password: 'password', username: 'AzureStorm', city: getRandomCity(), rank: getRankFromPoints(670), ...getWinsLosses(670) },
  { id: 'u-18', email: 'jade@test.com', password: 'password', username: 'JadeDragon', city: getRandomCity(), rank: getRankFromPoints(610), ...getWinsLosses(610) },
  { id: 'u-19', email: 'amber@test.com', password: 'password', username: 'AmberBlaze', city: getRandomCity(), rank: getRankFromPoints(570), ...getWinsLosses(570) },
  { id: 'u-20', email: 'onyx@test.com', password: 'password', username: 'OnyxGuard', city: getRandomCity(), rank: getRankFromPoints(700), ...getWinsLosses(700) },
  { id: 'u-21', email: 'scarlet@test.com', password: 'password', username: 'ScarletFang', city: getRandomCity(), rank: getRankFromPoints(480), ...getWinsLosses(480) },
  { id: 'u-22', email: 'cobalt@test.com', password: 'password', username: 'CobaltShield', city: getRandomCity(), rank: getRankFromPoints(520), ...getWinsLosses(520) },
  { id: 'u-23', email: 'ruby@test.com', password: 'password', username: 'RubyArrow', city: getRandomCity(), rank: getRankFromPoints(460), ...getWinsLosses(460) },
  { id: 'u-24', email: 'sapphire@test.com', password: 'password', username: 'SapphireStrike', city: getRandomCity(), rank: getRankFromPoints(440), ...getWinsLosses(440) },
  { id: 'u-25', email: 'emerald@test.com', password: 'password', username: 'EmeraldFlash', city: getRandomCity(), rank: getRankFromPoints(490), ...getWinsLosses(490) },
  { id: 'u-26', email: 'topaz@test.com', password: 'password', username: 'TopazRush', city: getRandomCity(), rank: getRankFromPoints(510), ...getWinsLosses(510) },
  { id: 'u-27', email: 'pearl@test.com', password: 'password', username: 'PearlWave', city: getRandomCity(), rank: getRankFromPoints(420), ...getWinsLosses(420) },
  { id: 'u-28', email: 'garnet@test.com', password: 'password', username: 'GarnetBlade', city: getRandomCity(), rank: getRankFromPoints(390), ...getWinsLosses(390) },
  { id: 'u-29', email: 'quartz@test.com', password: 'password', username: 'QuartzHammer', city: getRandomCity(), rank: getRankFromPoints(360), ...getWinsLosses(360) },
  { id: 'u-30', email: 'obsidian@test.com', password: 'password', username: 'ObsidianFist', city: getRandomCity(), rank: getRankFromPoints(330), ...getWinsLosses(330) },
  { id: 'u-31', email: 'meteor@test.com', password: 'password', username: 'MeteorDash', city: getRandomCity(), rank: getRankFromPoints(290), ...getWinsLosses(290) },
  { id: 'u-32', email: 'comet@test.com', password: 'password', username: 'CometTrail', city: getRandomCity(), rank: getRankFromPoints(250), ...getWinsLosses(250) },
  { id: 'u-33', email: 'nebula@test.com', password: 'password', username: 'NebulaDrift', city: getRandomCity(), rank: getRankFromPoints(220), ...getWinsLosses(220) },
  { id: 'u-34', email: 'pulsar@test.com', password: 'password', username: 'PulsarBeat', city: getRandomCity(), rank: getRankFromPoints(190), ...getWinsLosses(190) },
  { id: 'u-35', email: 'stellar@test.com', password: 'password', username: 'StellarGaze', city: getRandomCity(), rank: getRankFromPoints(150), ...getWinsLosses(150) },
  { id: 'u-36', email: 'cosmic@test.com', password: 'password', username: 'CosmicRay', city: getRandomCity(), rank: getRankFromPoints(120), ...getWinsLosses(120) },
  { id: 'u-37', email: 'astral@test.com', password: 'password', username: 'AstralBeam', city: getRandomCity(), rank: getRankFromPoints(90), ...getWinsLosses(90) },
  { id: 'u-38', email: 'zenith@test.com', password: 'password', username: 'ZenithPeak', city: getRandomCity(), rank: getRankFromPoints(60), ...getWinsLosses(60) },
  { id: 'u-39', email: 'apex@test.com', password: 'password', username: 'ApexHunter', city: getRandomCity(), rank: getRankFromPoints(30), ...getWinsLosses(30) },
  { id: 'u-40', email: 'prime@test.com', password: 'password', username: 'PrimeForce', city: getRandomCity(), rank: getRankFromPoints(10), ...getWinsLosses(10) },
  { id: 'u-41', email: 'night@test.com', password: 'password', username: 'NightShade', city: getRandomCity(), rank: getRankFromPoints(750), ...getWinsLosses(750) },
  { id: 'u-42', email: 'dawn@test.com', password: 'password', username: 'DawnBreaker', city: getRandomCity(), rank: getRankFromPoints(410), ...getWinsLosses(410) },
  { id: 'u-43', email: 'dusk@test.com', password: 'password', username: 'DuskWalker', city: getRandomCity(), rank: getRankFromPoints(280), ...getWinsLosses(280) },
  { id: 'u-44', email: 'twilight@test.com', password: 'password', username: 'TwilightStar', city: getRandomCity(), rank: getRankFromPoints(170), ...getWinsLosses(170) },
  { id: 'u-45', email: 'eclipse@test.com', password: 'password', username: 'EclipseVoid', city: getRandomCity(), rank: getRankFromPoints(45), ...getWinsLosses(45) },
].map((user, idx) => ({
  ...user,
  reputation: 4.2 + Math.random() * 0.8,
  level: Math.floor((user.rank.points || 0) / 20) + 1,
  createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
}));

function getWinsLosses(rp: number): { wins: number; losses: number } {
  let tier = 'Cuivre';
  if (rp >= 720) tier = 'Platinum';
  else if (rp >= 420) tier = 'Gold';
  else if (rp >= 180) tier = 'Silver';
  
  const [wins, losses] = getRandomWinsLosses(tier);
  return { wins, losses };
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const DEFAULT_MATCH_1_ID = generateUUID();
const DEFAULT_MATCH_2_ID = generateUUID();

const DEFAULT_MOCK_MATCHES: MockMatch[] = [
  {
    id: DEFAULT_MATCH_1_ID,
    type: 'official',
    status: 'waiting',
    hostId: 'u-01',
    playerIds: ['u-01', 'u-02'],
    maxPlayers: 4,
    field: FIELDS[0],
    pointReward: 50,
    pointPenalty: 30,
    createdAt: new Date(),
    playerPositions: [
      { playerId: 'u-01', position: 'top-left' },
      { playerId: 'u-02', position: 'bottom-left' },
    ],
    chatRoomId: `chat-${DEFAULT_MATCH_1_ID}`,
  },
  {
    id: DEFAULT_MATCH_2_ID,
    type: 'friendly',
    status: 'waiting',
    hostId: 'u-03',
    playerIds: ['u-03'],
    maxPlayers: 4,
    field: FIELDS[1],
    pointReward: 25,
    pointPenalty: 15,
    createdAt: new Date(),
    playerPositions: [
      { playerId: 'u-03', position: 'top-right' },
    ],
    chatRoomId: `chat-${DEFAULT_MATCH_2_ID}`,
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
          { matchId: DEFAULT_MATCH_1_ID, userId: 'u-01' },
          { matchId: DEFAULT_MATCH_1_ID, userId: 'u-02' },
          { matchId: DEFAULT_MATCH_2_ID, userId: 'u-03' },
        ],
        chatRooms: [
          { id: `chat-${DEFAULT_MATCH_1_ID}`, matchId: DEFAULT_MATCH_1_ID, participantIds: ['u-01', 'u-02'], messages: [], createdAt: new Date() },
          { id: `chat-${DEFAULT_MATCH_2_ID}`, matchId: DEFAULT_MATCH_2_ID, participantIds: ['u-03'], messages: [], createdAt: new Date() },
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
    const match1Id = generateUUID();
    const match2Id = generateUUID();

    this.data = {
      users: DEFAULT_MOCK_USERS,
      matches: [
        {
          ...DEFAULT_MOCK_MATCHES[0],
          id: match1Id,
          chatRoomId: `chat-${match1Id}`,
        },
        {
          ...DEFAULT_MOCK_MATCHES[1],
          id: match2Id,
          chatRoomId: `chat-${match2Id}`,
        },
      ],
      matchPlayers: [
        { matchId: match1Id, userId: 'u-01' },
        { matchId: match1Id, userId: 'u-02' },
        { matchId: match2Id, userId: 'u-03' },
      ],
      chatRooms: [
        { id: `chat-${match1Id}`, matchId: match1Id, participantIds: ['u-01', 'u-02'], messages: [], createdAt: new Date() },
        { id: `chat-${match2Id}`, matchId: match2Id, participantIds: ['u-03'], messages: [], createdAt: new Date() },
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

  async createMatch(hostId: string, matchData: Partial<MockMatch> & { hostPosition?: CourtPosition }): Promise<MockMatch> {
    if (!this.data) await this.initialize();

    const hostPosition = matchData.hostPosition || 'top-left';
    const matchId = generateUUID();

    const newMatch: MockMatch = {
      id: matchId,
      type: matchData.type || 'friendly',
      status: 'waiting',
      hostId,
      playerIds: [hostId],
      maxPlayers: matchData.maxPlayers || 4,
      field: matchData.field || FIELDS[0],
      pointReward: matchData.pointReward || 25,
      pointPenalty: matchData.pointPenalty || 15,
      createdAt: new Date(),
      playerPositions: [{ playerId: hostId, position: hostPosition }],
      chatRoomId: '',
      isRankOpen: matchData.isRankOpen !== undefined ? matchData.isRankOpen : true,
      minRank: matchData.minRank,
      maxRank: matchData.maxRank,
    };

    if (matchData.scheduledTime) {
      newMatch.scheduledTime = matchData.scheduledTime;
    }

    if (!Array.isArray(this.data!.matches)) {
      this.data!.matches = [];
    }
    if (!Array.isArray(this.data!.matchPlayers)) {
      this.data!.matchPlayers = [];
    }
    if (!Array.isArray(this.data!.chatRooms)) {
      this.data!.chatRooms = [];
    }

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
    return this.data?.matches || [];
  }

  async joinMatch(matchId: string, userId: string, position?: CourtPosition): Promise<void> {
    if (!this.data) await this.initialize();

    const match = this.data!.matches.find((m) => m.id === matchId);
    if (!match) throw new Error('Match not found');

    if (!Array.isArray(match.playerIds)) {
      match.playerIds = [];
    }
    if (!Array.isArray(match.playerPositions)) {
      match.playerPositions = [];
    }

    if (match.playerIds.includes(userId)) {
      throw new Error('Already in match');
    }

    const user = this.data!.users.find((u) => u.id === userId);
    if (user && !match.isRankOpen && (match.minRank || match.maxRank)) {
      const { isRankInRange } = await import('@/utils/rankUtils');
      const userRank = { division: user.rank.division, level: user.rank.level };
      
      if (!isRankInRange(userRank, match.minRank, match.maxRank)) {
        const { formatRankRange } = await import('@/utils/rankUtils');
        const rangeText = formatRankRange(match.minRank, match.maxRank);
        throw new Error(`This match is limited to players ${rangeText}.`);
      }
    }

    if (match.playerIds.length >= match.maxPlayers) {
      throw new Error('Match is full');
    }

    if (position && match.playerPositions.some((p) => p.position === position)) {
      throw new Error('Position already taken');
    }

    const selectedPosition = position || this.getFirstAvailablePosition(match.playerPositions);

    match.playerIds.push(userId);
    match.playerPositions.push({ playerId: userId, position: selectedPosition });
    
    if (!Array.isArray(this.data!.matchPlayers)) {
      this.data!.matchPlayers = [];
    }
    this.data!.matchPlayers.push({ matchId, userId });

    await this.save();
  }

  private getFirstAvailablePosition(occupiedPositions: { playerId: string; position: CourtPosition }[]): CourtPosition {
    const allPositions: CourtPosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    const occupied = occupiedPositions.map((p) => p.position);
    return allPositions.find((pos) => !occupied.includes(pos)) || 'top-left';
  }

  async leaveMatch(matchId: string, userId: string): Promise<void> {
    if (!this.data) await this.initialize();

    const match = this.data!.matches.find((m) => m.id === matchId);
    if (!match) throw new Error('Match not found');

    if (Array.isArray(match.playerIds)) {
      match.playerIds = match.playerIds.filter((id) => id !== userId);
    }
    if (Array.isArray(match.playerPositions)) {
      match.playerPositions = match.playerPositions.filter((p) => p.playerId !== userId);
    }
    if (Array.isArray(this.data!.matchPlayers)) {
      this.data!.matchPlayers = this.data!.matchPlayers.filter(
        (mp) => !(mp.matchId === matchId && mp.userId === userId)
      );
    }

    await this.save();
  }

  async getMatchPlayers(matchId: string): Promise<MockUser[]> {
    if (!this.data) await this.initialize();

    if (!this.data || !this.data.matchPlayers) {
      return [];
    }

    const playerEntries = this.data.matchPlayers.filter((mp) => mp.matchId === matchId) || [];
    const players: MockUser[] = [];

    for (const entry of playerEntries) {
      const user = await this.getUser(entry.userId);
      if (user) players.push(user);
    }

    return players;
  }

  async findOpenMatch(tier: string, userId?: string): Promise<MockMatch | null> {
    if (!this.data) await this.initialize();

    const openMatches = this.data!.matches.filter(
      (m) => m.status === 'waiting' && m.playerIds.length < m.maxPlayers && (!userId || !m.playerIds.includes(userId))
    );

    return openMatches[0] || null;
  }

  async isUserInActiveMatch(userId: string): Promise<boolean> {
    if (!this.data) await this.initialize();

    const activeMatch = this.data!.matches.find(
      (m) => (m.status === 'waiting' || m.status === 'in_progress') && m.playerIds.includes(userId)
    );

    return !!activeMatch;
  }

  async getChatRoom(chatRoomId: string): Promise<ChatRoom | null> {
    if (!this.data) await this.initialize();
    return this.data!.chatRooms.find((c) => c.id === chatRoomId) || null;
  }

  async sendMessage(chatRoomId: string, senderId: string, senderName: string, message: string): Promise<ChatMessage> {
    if (!this.data) await this.initialize();

    const chatRoom = this.data!.chatRooms.find((c) => c.id === chatRoomId);
    if (!chatRoom) throw new Error('Chat room not found');

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      chatRoomId,
      senderId,
      senderName,
      message,
      timestamp: new Date(),
      isRead: false,
    };

    chatRoom.messages.push(newMessage);
    await this.save();
    return newMessage;
  }

  async getChatMessages(chatRoomId: string): Promise<ChatMessage[]> {
    if (!this.data) await this.initialize();
    const chatRoom = this.data!.chatRooms.find((c) => c.id === chatRoomId);
    return chatRoom?.messages || [];
  }
}

export const mockDataProvider = new MockDataProvider();
