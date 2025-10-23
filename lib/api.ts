import { Platform } from 'react-native';

const getApiUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  
  if (envUrl) {
    return envUrl;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  
  if (Platform.OS === 'ios') {
    return 'http://localhost:8000';
  }
  
  return 'http://127.0.0.1:8000';
};

export const API_URL = getApiUrl();

console.log('📡 API URL configured:', API_URL);

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
}

export interface Player {
  id: string;
  email: string;
  username: string;
  level_score: number;
  level_tier: string;
  created_at?: string;
  updated_at?: string;
}

export interface RankingAssessment {
  score: number;
  tier: string;
}

export interface LeaderboardEntry {
  rank: number;
  player_id: string;
  username: string;
  level_score: number;
  level_tier: string;
}

async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_URL}${endpoint}`;
  console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const text = await response.text();
    let data: any;
    
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    console.log(`📊 API Response [${response.status}]:`, data);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized. Please log in again.');
      }
      throw new Error(data.detail || data.message || data.error || 'Request failed');
    }

    return data as T;
  } catch (error: any) {
    console.error(`❌ API Error: ${endpoint}`, error);
    throw error;
  }
}

export const api = {
  auth: {
    register: (data: RegisterRequest) =>
      apiRequest<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    login: (data: LoginRequest) =>
      apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  players: {
    me: (token: string) =>
      apiRequest<Player>('/players/me', {}, token),

    update: (token: string, updates: Partial<Player>) =>
      apiRequest<Player>('/players/me', {
        method: 'PUT',
        body: JSON.stringify(updates),
      }, token),
  },

  rankings: {
    assess: (token: string, answers: Record<string, any>) =>
      apiRequest<RankingAssessment>('/rankings/assess', {
        method: 'POST',
        body: JSON.stringify(answers),
      }, token),

    leaderboard: () =>
      apiRequest<LeaderboardEntry[]>('/rankings/leaderboard'),
  },
};
