
/**
 * Logger utility for consistent client-side logging
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export const logger = {
  error: (module: string, message: string, data?: any) => {
    console.error(`[ERROR][${module}] ${message}`, data || '');
  },
  
  warn: (module: string, message: string, data?: any) => {
    console.warn(`[WARN][${module}] ${message}`, data || '');
  },
  
  info: (module: string, message: string, data?: any) => {
    console.info(`[INFO][${module}] ${message}`, data || '');
  },
  
  debug: (module: string, message: string, data?: any) => {
    console.debug(`[DEBUG][${module}] ${message}`, data || '');
  }
};
