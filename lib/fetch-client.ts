import { supabase } from './supabase';

const REQUEST_TIMEOUT = 5000;
const MAX_RETRIES = 2;

export type FetchError = {
  message: string;
  status?: number;
  code?: string;
  isNetworkError?: boolean;
  isRLSError?: boolean;
  isTimeout?: boolean;
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableError(error: any): boolean {
  if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
    return true;
  }
  if (error?.message?.includes('network') || error?.message?.includes('timeout')) {
    return true;
  }
  return false;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`🌐 Fetch attempt ${attempt + 1}/${retries + 1}: ${options.method || 'GET'} ${url}`);
      const response = await fetchWithTimeout(url, options, REQUEST_TIMEOUT);
      
      if (response.status === 401 || response.status === 403) {
        const error: FetchError = {
          message: 'Access denied (RLS). You may be logged out or missing permissions.',
          status: response.status,
          isRLSError: true,
        };
        throw error;
      }

      return response;
    } catch (error: any) {
      lastError = error;

      if (error?.isRLSError) {
        console.error('❌ RLS error detected, force sign out');
        await supabase.auth.signOut();
        throw error;
      }

      if (attempt < retries && isRetryableError(error)) {
        const delayMs = Math.pow(2, attempt) * 500;
        console.warn(`⚠️ Retrying after ${delayMs}ms due to:`, error?.message);
        await sleep(delayMs);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

export function normalizeFetchError(error: any): FetchError {
  if (error?.isRLSError) {
    return error as FetchError;
  }

  const isTimeout = error?.message?.includes('timeout') || error?.name === 'AbortError';
  const isNetwork = error?.code === 'ECONNRESET' || 
                    error?.code === 'ETIMEDOUT' || 
                    error?.message?.includes('network') ||
                    error?.message?.includes('Failed to fetch');

  return {
    message: error?.message || 'Request failed',
    status: error?.status,
    code: error?.code,
    isNetworkError: isNetwork,
    isTimeout,
  };
}

export async function supabaseWithRLS<T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: FetchError | null }> {
  try {
    const result = await operation();

    if (result.error) {
      if (result.error.code === '401' || result.error.code === '403' || result.error.status === 401 || result.error.status === 403) {
        console.error('❌ RLS error detected, force sign out');
        await supabase.auth.signOut();
        return {
          data: null,
          error: {
            message: 'Access denied (RLS). You may be logged out or missing permissions.',
            status: 401,
            isRLSError: true,
          },
        };
      }

      return {
        data: null,
        error: normalizeFetchError(result.error),
      };
    }

    return { data: result.data, error: null };
  } catch (error: any) {
    return {
      data: null,
      error: normalizeFetchError(error),
    };
  }
}
