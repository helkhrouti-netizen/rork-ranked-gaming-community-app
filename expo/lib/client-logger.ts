import { supabase } from './supabase';
import Constants from 'expo-constants';

export type LogLevel = 'error' | 'warn' | 'info';

export type ClientLog = {
  level: LogLevel;
  event: string;
  message: string;
  screen?: string;
  user_id?: string;
  app_version?: string;
  metadata?: Record<string, any>;
  timestamp: string;
};

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

async function sendLogToSupabase(log: ClientLog): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    const logEntry = {
      ...log,
      user_id: session?.user?.id || 'anonymous',
      app_version: APP_VERSION,
    };

    const { error } = await supabase
      .from('client_logs')
      .insert(logEntry);

    if (error) {
      console.warn('Failed to send log to Supabase:', error);
    }
  } catch (error) {
    console.warn('Failed to send log to Supabase:', error);
  }
}

export function logClientEvent(
  level: LogLevel,
  event: string,
  message: string,
  screen?: string,
  metadata?: Record<string, any>
): void {
  const log: ClientLog = {
    level,
    event,
    message,
    screen,
    metadata,
    timestamp: new Date().toISOString(),
  };

  if (level === 'error') {
    console.error(`[${event}] ${message}`, metadata);
  } else if (level === 'warn') {
    console.warn(`[${event}] ${message}`, metadata);
  } else {
    console.log(`[${event}] ${message}`, metadata);
  }

  sendLogToSupabase(log).catch(() => {});
}

export function logBootTimeout(step: string, error?: any): void {
  const errorDetails = error ? {
    message: error?.message || String(error),
    code: error?.code,
    stack: error?.stack,
    ...error
  } : undefined;
  
  logClientEvent(
    'error', 
    'BOOT_TIMEOUT', 
    `Boot timeout at step: ${step}${errorDetails?.message ? ' - ' + errorDetails.message : ''}`, 
    'boot', 
    { step, error: errorDetails }
  );
}

export function logDBHealthError(error: any): void {
  logClientEvent('error', 'DB_HEALTH', `Database health check failed: ${error?.message}`, 'boot', { 
    error: error?.message,
    code: error?.code,
  });
}

export function logRLSError(screen: string, operation: string, error: any): void {
  logClientEvent('error', 'RLS_AUTH', `RLS error on ${operation}`, screen, {
    operation,
    error: error?.message,
    code: error?.code,
  });
}

export function logI18nError(error: any): void {
  logClientEvent('error', 'I18N_INIT', `i18n initialization failed: ${error?.message}`, 'boot', {
    error: error?.message,
  });
}

export function logNetworkOffline(screen: string): void {
  logClientEvent('warn', 'NETWORK_OFFLINE', 'Network is offline', screen);
}

export function logConfigError(error: any): void {
  logClientEvent('error', 'CONFIG_ERROR', `Configuration error: ${error?.message}`, 'boot', {
    error: error?.message,
  });
}
