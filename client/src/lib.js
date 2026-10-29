export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const money = (n) => `$${Number(n || 0).toLocaleString()}`;

export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export const fmtTime = (iso) => new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

export const fmtDateTime = (iso) => `${fmtDate(iso)}, ${fmtTime(iso)}`;

export const dayKey = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const minToTime = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
export const timeToMin = (t) => {
  const [h, m] = String(t).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const deviceOffset = () => -new Date().getTimezoneOffset();

export const offsetLabel = (mins) => {
  const sign = mins >= 0 ? '+' : '-';
  const a = Math.abs(mins);
  return `UTC${sign}${Math.floor(a / 60)}${a % 60 ? ':' + String(a % 60).padStart(2, '0') : ''}`;
};

export const OFFSETS = [-480, -420, -360, -300, -240, 0, 60, 120, 180, 210, 240, 300, 330, 345, 360, 420, 480, 540, 600];

export const STATUS_LABEL = {
  pending_payment: 'Awaiting payment',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  paid: 'Paid',
  refunded: 'Refunded',
  active: 'Active',
  pending: 'Pending approval',
  suspended: 'Suspended',
};

export function initials(name = '') {
  return name
    .replace(/^(dr|mr|mrs|ms)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

// Turn a YouTube/Vimeo link into an embeddable URL. Returns null for anything else.
export function toEmbed(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) return `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
    if (u.hostname === 'youtu.be') return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes('youtube.com') && u.pathname.startsWith('/embed/')) return url;
    if (u.hostname.includes('vimeo.com')) return `https://player.vimeo.com/video/${u.pathname.split('/').filter(Boolean).pop()}`;
  } catch { /* not a URL */ }
  return null;
}

export const canJoin = (b) => {
  const now = Date.now();
  return b.status === 'confirmed' && now >= Date.parse(b.startAt) - 15 * 60000 && now <= Date.parse(b.endAt);
};
