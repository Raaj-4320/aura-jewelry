type Area = 'SYSTEM'|'ROUTE'|'AUTH'|'UI'|'PRODUCT'|'IMPORT'|'DB'|'CLOUDINARY'|'WHATSAPP'|'ERROR';
const enabled = import.meta.env.VITE_ENABLE_DEBUG_LOGS !== 'false';
const REDACT_KEYS = ['password','token','idtoken','refreshtoken','apikey','secret','privatekey','uploadpreset'];

function sanitize(value: any, depth = 0): any {
  if (depth > 4) return '[MaxDepth]';
  if (value == null) return value;
  if (typeof value === 'string') return value.length > 400 ? `${value.slice(0, 400)}…[truncated]` : value;
  if (Array.isArray(value)) return value.slice(0, 30).map((v) => sanitize(v, depth + 1));
  if (typeof value === 'object') {
    const out: Record<string, any> = {};
    Object.entries(value).forEach(([k, v]) => {
      const lk = k.toLowerCase();
      if (REDACT_KEYS.some((rk) => lk.includes(rk))) out[k] = '[REDACTED]';
      else out[k] = sanitize(v, depth + 1);
    });
    return out;
  }
  return value;
}

function base(area: Area, event: string, data?: any, status?: string) {
  if (!enabled) return;
  const payload = { timestamp: new Date().toISOString(), area, event, status, data: sanitize(data) };
  const prefix = `[${area}] ${event}`;
  if (data && typeof data === 'object') {
    console.groupCollapsed(prefix);
    console.log(payload);
    if (Array.isArray((payload as any).data)) {
      try { console.table((payload as any).data); } catch {}
    }
    console.groupEnd();
  } else {
    console.log(prefix, payload);
  }
}

export const logSystem = (event: string, data?: any, status?: string) => base('SYSTEM', event, data, status);
export const logUI = (event: string, data?: any, status?: string) => base('UI', event, data, status);
export const logRoute = (event: string, data?: any, status?: string) => base('ROUTE', event, data, status);
export const logAuth = (event: string, data?: any, status?: string) => base('AUTH', event, data, status);
export const logDB = (event: string, data?: any, status?: string) => base('DB', event, data, status);
export const logProduct = (event: string, data?: any, status?: string) => base('PRODUCT', event, data, status);
export const logImport = (event: string, data?: any, status?: string) => base('IMPORT', event, data, status);
export const logCloudinary = (event: string, data?: any, status?: string) => base('CLOUDINARY', event, data, status);
export const logWhatsApp = (event: string, data?: any, status?: string) => base('WHATSAPP', event, data, status);
export const logError = (event: string, error: unknown, data?: any) => base('ERROR', event, { ...(data || {}), error: error instanceof Error ? { message: error.message, name: error.name } : error }, 'failure');
