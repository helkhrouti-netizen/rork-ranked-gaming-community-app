export type RankDivision = 'Cuivre' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
export type RankLevel = 1 | 2 | 3;

export interface Rank {
  division: RankDivision;
  level: RankLevel;
  points: number;
}

export interface RankInfo {
  name: RankDivision;
  color: string;
  gradient: [string, string];
  pointsRange: [number, number];
  icon: string;
}

export interface DetailedRankInfo {
  division: RankDivision;
  level: RankLevel;
  displayName: string;
  padLevel: string;
  description: string;
  rpRange: [number, number];
  friendlyWin: number;
  friendlyLoss: number;
  officialWin: number;
  officialLoss: number;
  color: string;
  gradient: [string, string];
  icon: string;
}

export const DETAILED_RANKS: DetailedRankInfo[] = [
  {
    division: 'Cuivre',
    level: 1,
    displayName: 'Cuivre 1',
    padLevel: 'PAD Level 1',
    description: 'Beginner — just trying to keep the ball in play.',
    rpRange: [0, 59],
    friendlyWin: 35,
    friendlyLoss: 10,
    officialWin: 60,
    officialLoss: 25,
    color: '#CD7F32',
    gradient: ['#8B4513', '#CD7F32'],
    icon: '🥉',
  },
  {
    division: 'Cuivre',
    level: 2,
    displayName: 'Cuivre 2',
    padLevel: 'PAD Level 1',
    description: 'Beginner (basic) — can rally a few shots but inconsistent.',
    rpRange: [60, 119],
    friendlyWin: 35,
    friendlyLoss: 10,
    officialWin: 60,
    officialLoss: 25,
    color: '#CD7F32',
    gradient: ['#8B4513', '#CD7F32'],
    icon: '🥉',
  },
  {
    division: 'Cuivre',
    level: 3,
    displayName: 'Cuivre 3',
    padLevel: 'PAD Level 1',
    description: 'Beginner (advanced) — starting to control direction & speed.',
    rpRange: [120, 179],
    friendlyWin: 35,
    friendlyLoss: 10,
    officialWin: 60,
    officialLoss: 25,
    color: '#CD7F32',
    gradient: ['#8B4513', '#CD7F32'],
    icon: '🥉',
  },
  {
    division: 'Silver',
    level: 1,
    displayName: 'Silver 1',
    padLevel: 'PAD Level 2',
    description: 'Lower-intermediate — keeps rallies, struggles under pressure.',
    rpRange: [180, 259],
    friendlyWin: 30,
    friendlyLoss: 12,
    officialWin: 55,
    officialLoss: 28,
    color: '#C0C0C0',
    gradient: ['#A8A8A8', '#E8E8E8'],
    icon: '🥈',
  },
  {
    division: 'Silver',
    level: 2,
    displayName: 'Silver 2',
    padLevel: 'PAD Level 2',
    description: 'Intermediate — decent consistency, learning wall play.',
    rpRange: [260, 339],
    friendlyWin: 30,
    friendlyLoss: 12,
    officialWin: 55,
    officialLoss: 28,
    color: '#C0C0C0',
    gradient: ['#A8A8A8', '#E8E8E8'],
    icon: '🥈',
  },
  {
    division: 'Silver',
    level: 3,
    displayName: 'Silver 3',
    padLevel: 'PAD Level 2',
    description: 'Intermediate (strong) — confident, still developing power.',
    rpRange: [340, 419],
    friendlyWin: 30,
    friendlyLoss: 12,
    officialWin: 55,
    officialLoss: 28,
    color: '#C0C0C0',
    gradient: ['#A8A8A8', '#E8E8E8'],
    icon: '🥈',
  },
  {
    division: 'Gold',
    level: 1,
    displayName: 'Gold 1',
    padLevel: 'PAD Level 3',
    description: 'Upper-intermediate — good control, attacks from the back.',
    rpRange: [420, 519],
    friendlyWin: 25,
    friendlyLoss: 15,
    officialWin: 50,
    officialLoss: 30,
    color: '#FFD700',
    gradient: ['#FFA500', '#FFD700'],
    icon: '🥇',
  },
  {
    division: 'Gold',
    level: 2,
    displayName: 'Gold 2',
    padLevel: 'PAD Level 4',
    description: 'Advanced — consistent overheads, offensive mindset.',
    rpRange: [520, 619],
    friendlyWin: 25,
    friendlyLoss: 15,
    officialWin: 50,
    officialLoss: 30,
    color: '#FFD700',
    gradient: ['#FFA500', '#FFD700'],
    icon: '🥇',
  },
  {
    division: 'Gold',
    level: 3,
    displayName: 'Gold 3',
    padLevel: 'PAD Level 4',
    description: 'Advanced (strong) — controls rhythm & tempo.',
    rpRange: [620, 719],
    friendlyWin: 25,
    friendlyLoss: 15,
    officialWin: 50,
    officialLoss: 30,
    color: '#FFD700',
    gradient: ['#FFA500', '#FFD700'],
    icon: '🥇',
  },
  {
    division: 'Platinum',
    level: 1,
    displayName: 'Platinum 1',
    padLevel: 'PAD Level 5',
    description: 'Semi-professional — tactically smart, steady execution.',
    rpRange: [720, 839],
    friendlyWin: 25,
    friendlyLoss: 15,
    officialWin: 50,
    officialLoss: 30,
    color: '#00CED1',
    gradient: ['#4169E1', '#00CED1'],
    icon: '💎',
  },
  {
    division: 'Platinum',
    level: 2,
    displayName: 'Platinum 2',
    padLevel: 'PAD Level 6',
    description: 'Professional — trains regularly, mentally solid.',
    rpRange: [840, 959],
    friendlyWin: 25,
    friendlyLoss: 15,
    officialWin: 50,
    officialLoss: 30,
    color: '#00CED1',
    gradient: ['#4169E1', '#00CED1'],
    icon: '💎',
  },
  {
    division: 'Platinum',
    level: 3,
    displayName: 'Platinum 3',
    padLevel: 'PAD Level 6',
    description: 'Professional (strong) — tournament player, consistent.',
    rpRange: [960, 1079],
    friendlyWin: 25,
    friendlyLoss: 15,
    officialWin: 50,
    officialLoss: 30,
    color: '#00CED1',
    gradient: ['#4169E1', '#00CED1'],
    icon: '💎',
  },
  {
    division: 'Diamond',
    level: 1,
    displayName: 'Diamond 1',
    padLevel: 'PAD Level 7',
    description: 'Elite — national-level player, excellent technique.',
    rpRange: [1080, 1199],
    friendlyWin: 25,
    friendlyLoss: 15,
    officialWin: 50,
    officialLoss: 30,
    color: '#E935C1',
    gradient: ['#9B30FF', '#E935C1'],
    icon: '👑',
  },
  {
    division: 'Diamond',
    level: 2,
    displayName: 'Diamond 2',
    padLevel: 'PAD Level 7',
    description: 'Elite (advanced) — top event competitor, highly consistent.',
    rpRange: [1200, 1319],
    friendlyWin: 25,
    friendlyLoss: 15,
    officialWin: 50,
    officialLoss: 30,
    color: '#E935C1',
    gradient: ['#9B30FF', '#E935C1'],
    icon: '👑',
  },
  {
    division: 'Diamond',
    level: 3,
    displayName: 'Diamond 3',
    padLevel: 'PAD Level 7',
    description: 'Top-class — best of the best; performs under pressure.',
    rpRange: [1320, 9999],
    friendlyWin: 25,
    friendlyLoss: 15,
    officialWin: 50,
    officialLoss: 30,
    color: '#E935C1',
    gradient: ['#9B30FF', '#E935C1'],
    icon: '👑',
  },
];

export const RANK_INFO: Record<RankDivision, RankInfo> = {
  Cuivre: {
    name: 'Cuivre',
    color: '#CD7F32',
    gradient: ['#8B4513', '#CD7F32'],
    pointsRange: [0, 179],
    icon: '🥉',
  },
  Silver: {
    name: 'Silver',
    color: '#C0C0C0',
    gradient: ['#A8A8A8', '#E8E8E8'],
    pointsRange: [180, 419],
    icon: '🥈',
  },
  Gold: {
    name: 'Gold',
    color: '#FFD700',
    gradient: ['#FFA500', '#FFD700'],
    pointsRange: [420, 719],
    icon: '🥇',
  },
  Platinum: {
    name: 'Platinum',
    color: '#00CED1',
    gradient: ['#4169E1', '#00CED1'],
    pointsRange: [720, 1079],
    icon: '💎',
  },
  Diamond: {
    name: 'Diamond',
    color: '#E935C1',
    gradient: ['#9B30FF', '#E935C1'],
    pointsRange: [1080, 9999],
    icon: '👑',
  },
};

export function getRankFromPoints(points: number): Rank {
  const rankInfo = DETAILED_RANKS.find(
    (rank) => points >= rank.rpRange[0] && points <= rank.rpRange[1]
  );

  if (!rankInfo) {
    return {
      division: 'Diamond',
      level: 3,
      points,
    };
  }

  return {
    division: rankInfo.division,
    level: rankInfo.level,
    points,
  };
}

export function getNextRankPoints(currentPoints: number): number {
  const currentRankInfo = DETAILED_RANKS.find(
    (rank) => currentPoints >= rank.rpRange[0] && currentPoints <= rank.rpRange[1]
  );

  if (!currentRankInfo) {
    return 9999;
  }

  const currentIndex = DETAILED_RANKS.indexOf(currentRankInfo);
  if (currentIndex === DETAILED_RANKS.length - 1) {
    return 9999;
  }

  return DETAILED_RANKS[currentIndex + 1].rpRange[0];
}

export function formatRank(rank: Rank): string {
  return `${rank.division} ${rank.level}`;
}

export function getRPChangeForMatch(
  matchType: 'official' | 'friendly',
  result: 'win' | 'loss',
  currentPoints: number
): number {
  const rankInfo = DETAILED_RANKS.find(
    (rank) => currentPoints >= rank.rpRange[0] && currentPoints <= rank.rpRange[1]
  );

  if (!rankInfo) {
    return matchType === 'official' ? (result === 'win' ? 50 : -30) : (result === 'win' ? 25 : -15);
  }

  if (matchType === 'official') {
    return result === 'win' ? rankInfo.officialWin : -rankInfo.officialLoss;
  } else {
    return result === 'win' ? rankInfo.friendlyWin : -rankInfo.friendlyLoss;
  }
}

export function getDetailedRankInfo(division: RankDivision, level: RankLevel): DetailedRankInfo | undefined {
  return DETAILED_RANKS.find(
    (rank) => rank.division === division && rank.level === level
  );
}
