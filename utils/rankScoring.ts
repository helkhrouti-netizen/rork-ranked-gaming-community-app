export interface QuestionnaireAnswer {
  questionId: number;
  answer: number;
}

export interface RankResult {
  score: number;
  rankTier: 'Cuivre' | 'Silver' | 'Gold' | 'Platinum';
  rankSub: 1 | 2 | 3;
  rp: number;
}

const QUESTION_WEIGHTS: Record<number, number> = {
  1: 10,
  2: 12,
  3: 8,
  4: 10,
  5: 10,
  6: 10,
  7: 10,
  8: 8,
  9: 12,
  10: 10,
};

export function computeRankFromScore(answers: QuestionnaireAnswer[]): RankResult {
  let totalScore = 0 as number;

  for (const answer of answers) {
    const normalized = (answer.answer - 1) / 4;
    const weight = QUESTION_WEIGHTS[answer.questionId] || 0;
    totalScore += normalized * weight;
  }

  const score = Math.round(totalScore * 100) / 100;

  let rankTier: 'Cuivre' | 'Silver' | 'Gold' | 'Platinum' = 'Cuivre';
  let rankSub: 1 | 2 | 3 = 1;
  let rp = 0 as number;

  if (score >= 0 && score < 20) {
    rankTier = 'Cuivre';
    rankSub = 1;
    rp = Math.round(score * 3);
  } else if (score >= 20 && score < 27) {
    rankTier = 'Cuivre';
    rankSub = 2;
    rp = 60 + Math.round((score - 20) * 8.57);
  } else if (score >= 27 && score < 34) {
    rankTier = 'Cuivre';
    rankSub = 3;
    rp = 120 + Math.round((score - 27) * 8.57);
  } else if (score >= 34 && score < 41) {
    rankTier = 'Silver';
    rankSub = 1;
    rp = 180 + Math.round((score - 34) * 11.29);
  } else if (score >= 41 && score < 48) {
    rankTier = 'Silver';
    rankSub = 2;
    rp = 260 + Math.round((score - 41) * 11.29);
  } else if (score >= 48 && score < 55) {
    rankTier = 'Silver';
    rankSub = 3;
    rp = 340 + Math.round((score - 48) * 11.29);
  } else if (score >= 55 && score < 62) {
    rankTier = 'Gold';
    rankSub = 1;
    rp = 420 + Math.round((score - 55) * 14.14);
  } else if (score >= 62 && score < 69) {
    rankTier = 'Gold';
    rankSub = 2;
    rp = 520 + Math.round((score - 62) * 14.14);
  } else if (score >= 69 && score < 76) {
    rankTier = 'Gold';
    rankSub = 3;
    rp = 620 + Math.round((score - 69) * 14.14);
  } else if (score >= 76 && score < 83) {
    rankTier = 'Platinum';
    rankSub = 1;
    rp = 720 + Math.round((score - 76) * 17.14);
  } else if (score >= 83 && score < 90) {
    rankTier = 'Platinum';
    rankSub = 2;
    rp = 840 + Math.round((score - 83) * 17);
  } else {
    rankTier = 'Platinum';
    rankSub = 3;
    rp = 960 + Math.round((score - 90) * 11.9);
  }

  return { score, rankTier, rankSub, rp };
}

export const QUESTIONNAIRE_QUESTIONS = [
  {
    id: 1,
    text: 'I have played padel for at least 12 months.',
    weight: 10,
  },
  {
    id: 2,
    text: 'I play padel matches 2+ times per week.',
    weight: 12,
  },
  {
    id: 3,
    text: 'I regularly play full matches (sets/tie-breaks).',
    weight: 8,
  },
  {
    id: 4,
    text: 'I have played club/tournament matches.',
    weight: 10,
  },
  {
    id: 5,
    text: 'Technique – Groundstrokes (forehand/backhand) are reliable.',
    weight: 10,
  },
  {
    id: 6,
    text: 'Technique – Serve & return are consistent under pressure.',
    weight: 10,
  },
  {
    id: 7,
    text: 'Net play – Volleys/overheads are controlled and placed.',
    weight: 10,
  },
  {
    id: 8,
    text: 'Lobs/smash – I can lob and finish overheads effectively.',
    weight: 8,
  },
  {
    id: 9,
    text: 'Tactics – I know positioning, when to attack/defend, communicate well.',
    weight: 12,
  },
  {
    id: 10,
    text: 'Consistency/Fitness – I keep low errors and maintain intensity.',
    weight: 10,
  },
];
