import { DETAILED_RANKS, DetailedRankInfo } from '@/constants/ranks';

export function getRankDisplayName(division: string, level: number): string {
  const rank = DETAILED_RANKS.find(
    (r) => r.division === division && r.level === level
  );
  return rank ? rank.displayName : `${division} ${level}`;
}

export function parseRankDisplayName(displayName: string): { division: string; level: number } | null {
  const rank = DETAILED_RANKS.find((r) => r.displayName === displayName);
  if (!rank) return null;
  return { division: rank.division, level: rank.level };
}

export function getRankIndex(division: string, level: number): number {
  const index = DETAILED_RANKS.findIndex(
    (r) => r.division === division && r.level === level
  );
  return index !== -1 ? index : 0;
}

export function getRankByIndex(index: number): DetailedRankInfo | null {
  return DETAILED_RANKS[index] || null;
}

export function isRankInRange(
  userRank: { division: string; level: number },
  minRank: string | null | undefined,
  maxRank: string | null | undefined
): boolean {
  if (!minRank && !maxRank) return true;

  const userIndex = getRankIndex(userRank.division, userRank.level);

  if (minRank) {
    const minParsed = parseRankDisplayName(minRank);
    if (minParsed) {
      const minIndex = getRankIndex(minParsed.division, minParsed.level);
      if (userIndex < minIndex) return false;
    }
  }

  if (maxRank) {
    const maxParsed = parseRankDisplayName(maxRank);
    if (maxParsed) {
      const maxIndex = getRankIndex(maxParsed.division, maxParsed.level);
      if (userIndex > maxIndex) return false;
    }
  }

  return true;
}

export function formatRankRange(minRank: string | null | undefined, maxRank: string | null | undefined): string {
  if (!minRank && !maxRank) return 'All ranks';
  if (minRank && !maxRank) return `${minRank}+`;
  if (!minRank && maxRank) return `Up to ${maxRank}`;
  return `${minRank} – ${maxRank}`;
}

export function getAllRankOptions(): string[] {
  return DETAILED_RANKS.map((r) => r.displayName);
}
