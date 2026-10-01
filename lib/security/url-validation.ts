import dns from 'node:dns/promises';
import { isIP } from 'node:net';

export interface ValidatedTarget {
  url: URL;
  resolvedIp: string;
}

export class SecurityValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'SecurityValidationError';
  }
}

/**
 * Checks whether an IPv4 address is in a private, loopback, link-local, or reserved range.
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IPv4 is treated as unsafe
  }

  const [a, b, c, d] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 10.0.0.0/8 (Private)
  if (a === 10) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 100.64.0.0/10 (Shared Address Space / CGNAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 169.254.0.0/16 (Link-local & Cloud Metadata 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 (Private: 172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (a === 192 && b === 0 && c === 0) return true;

  // 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 0 && c === 2) return true;

  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;

  // 198.18.0.0/15 (Benchmarking)
  if (a === 198 && (b === 18 || b === 19)) return true;

  // 198.51.100.0/24 (TEST-NET-2)
  if (a === 198 && b === 51 && c === 100) return true;

  // 203.0.113.0/24 (TEST-NET-3)
  if (a === 203 && b === 0 && c === 113) return true;

  // 224.0.0.0/4 (Multicast: 224.0.0.0 - 239.255.255.255)
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 (Reserved / Future Use)
  if (a >= 240) return true;

  // 255.255.255.255 (Broadcast)
  if (a === 255 && b === 255 && c === 255 && d === 255) return true;

  return false;
}

/**
 * Checks whether an IPv6 address is in a private, loopback, link-local, or reserved range.
 */
function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // Loopback (::1)
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;

  // Unspecified (::)
  if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;

  // IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
  if (normalized.startsWith('::ffff:') || normalized.startsWith('0:0:0:0:0:ffff:')) {
    const ipv4Part = normalized.split(':').pop() || '';
    if (isIP(ipv4Part) === 4) {
      return isPrivateIPv4(ipv4Part);
    }
    return true;
  }

  // Unique Local Address (fc00::/7: fc00:: - fdff::)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

  // Link-Local Unicast (fe80::/10: fe80:: - febf::)
  if (
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb')
  ) {
    return true;
  }

  // Multicast (ff00::/8)
  if (normalized.startsWith('ff')) return true;

  return false;
}

/**
 * Validates a single IP address against blocked private/internal ranges.
 */
export function isIpBlocked(ip: string): boolean {
  const ipVersion = isIP(ip);
  if (ipVersion === 4) {
    return isPrivateIPv4(ip);
  }
  if (ipVersion === 6) {
    return isPrivateIPv6(ip);
  }
  return true; // Not a valid IP format
}

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata',
  'metadata.google.internal',
  'instance-data',
  'internal',
]);

/**
 * Validates an input URL string and ensures it is a public HTTP/HTTPS URL
 * that does not resolve to internal/private/loopback infrastructure (SSRF protection).
 */
export async function validateUrlForSSR(rawUrl: string): Promise<ValidatedTarget> {
  let trimmed = rawUrl.trim();
  if (!trimmed) {
    throw new SecurityValidationError('URL cannot be empty.', 'EMPTY_URL');
  }

  // Automatically prepend https:// if protocol is missing
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new SecurityValidationError(
      'Invalid URL format. Please provide a valid web address (e.g. https://example.com).',
      'INVALID_URL'
    );
  }

  // Only allow http: or https:
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new SecurityValidationError(
      'Only HTTP and HTTPS protocols are allowed.',
      'UNSUPPORTED_PROTOCOL'
    );
  }

  // Disallow user credentials in URL (e.g., http://admin:pass@host)
  if (parsed.username || parsed.password) {
    throw new SecurityValidationError(
      'URLs containing user credentials are not allowed.',
      'CREDENTIALS_FORBIDDEN'
    );
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check blocked hostnames
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.lan') ||
    hostname.endsWith('.localdomain')
  ) {
    throw new SecurityValidationError(
      'Requests to localhost or internal network hosts are blocked for security.',
      'INTERNAL_HOST_BLOCKED'
    );
  }

  // If hostname is directly an IP literal, validate immediately
  if (isIP(hostname)) {
    if (isIpBlocked(hostname)) {
      throw new SecurityValidationError(
        'Requests to private, loopback, or internal IP addresses are blocked.',
        'PRIVATE_IP_BLOCKED'
      );
    }
    return { url: parsed, resolvedIp: hostname };
  }

  // Resolve hostname via DNS to ensure it doesn't map to a private/internal IP
  let resolvedIps: string[] = [];
  try {
    const lookupResults = await dns.lookup(hostname, { all: true });
    resolvedIps = lookupResults.map((r) => r.address);
  } catch (dnsErr: unknown) {
    const errorMsg = dnsErr instanceof Error ? dnsErr.message : 'DNS lookup failed';
    throw new SecurityValidationError(
      `Could not resolve hostname "${hostname}". Please check that the domain exists and is active. (${errorMsg})`,
      'DNS_RESOLUTION_FAILED'
    );
  }

  if (resolvedIps.length === 0) {
    throw new SecurityValidationError(
      `No IP addresses found for hostname "${hostname}".`,
      'DNS_NO_RECORDS'
    );
  }

  // Check all resolved IPs; if ANY resolved IP is in a blocked range, reject the request!
  for (const ip of resolvedIps) {
    if (isIpBlocked(ip)) {
      throw new SecurityValidationError(
        `Hostname "${hostname}" resolves to a blocked or internal IP (${ip}).`,
        'PRIVATE_IP_BLOCKED'
      );
    }
  }

  return {
    url: parsed,
    resolvedIp: resolvedIps[0],
  };
}

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxRedirects?: number;
  maxSizeBytes?: number;
  headers?: Record<string, string>;
}

export interface SafeFetchResult {
  status: number;
  statusText: string;
  finalUrl: string;
  headers: Headers;
  contentType: string;
  body: string;
  isHttps: boolean;
  redirectCount: number;
}

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MAX_REDIRECTS = 5;
const DEFAULT_MAX_SIZE_BYTES = 2.5 * 1024 * 1024; // 2.5 MB

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (compatible; AIEO-Checker/1.0; +https://skydevlab.com/aieo-checker)';

/**
 * Secure HTTP client that enforces:
 * - SSRF re-validation on every redirect
 * - Execution timeout
 * - Body size limit (streams and truncates/stops reading to prevent memory exhaustion)
 * - Safe headers
 */
export async function safeFetch(
  initialUrl: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const maxSizeBytes = options.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;

  let currentUrl = initialUrl;
  let redirectCount = 0;

  while (redirectCount <= maxRedirects) {
    // Validate target URL and resolved IP on every hop
    const validated = await validateUrlForSSR(currentUrl);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(validated.url.toString(), {
        method: 'GET',
        redirect: 'manual', // Handle redirects manually for SSRF safety!
        signal: controller.signal,
        headers: {
          'User-Agent': DEFAULT_USER_AGENT,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          ...options.headers,
        },
      });
    } catch (err: unknown) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new SecurityValidationError(
          `Request to ${validated.url.hostname} timed out after ${timeoutMs}ms. The server took too long to respond.`,
          'FETCH_TIMEOUT'
        );
      }
      throw new SecurityValidationError(
        `Unable to connect to ${validated.url.hostname}. ${err instanceof Error ? err.message : 'Network error'}`,
        'FETCH_NETWORK_ERROR'
      );
    } finally {
      clearTimeout(timer);
    }

    // Handle 3xx redirects
    if (
      [301, 302, 303, 307, 308].includes(response.status) &&
      response.headers.has('location')
    ) {
      redirectCount++;
      if (redirectCount > maxRedirects) {
        throw new SecurityValidationError(
          `Too many redirects (exceeded limit of ${maxRedirects}).`,
          'TOO_MANY_REDIRECTS'
        );
      }

      const location = response.headers.get('location')!;
      try {
        currentUrl = new URL(location, validated.url).toString();
      } catch {
        throw new SecurityValidationError(
          `Invalid redirect location header: ${location}`,
          'INVALID_REDIRECT'
        );
      }
      continue;
    }

    // Read response body safely with size limit
    const contentType = response.headers.get('content-type') || '';
    let body = '';

    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8', { fatal: false });
      let bytesRead = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        bytesRead += value.length;
        if (bytesRead > maxSizeBytes) {
          // Cancel stream early to protect memory
          await reader.cancel();
          body += decoder.decode(value, { stream: false });
          break;
        }

        body += decoder.decode(value, { stream: true });
      }
    } else {
      body = await response.text();
    }

    return {
      status: response.status,
      statusText: response.statusText,
      finalUrl: validated.url.toString(),
      headers: response.headers,
      contentType,
      body,
      isHttps: validated.url.protocol === 'https:',
      redirectCount,
    };
  }

  throw new SecurityValidationError(
    `Exceeded maximum allowed redirects (${maxRedirects}).`,
    'TOO_MANY_REDIRECTS'
  );
}
