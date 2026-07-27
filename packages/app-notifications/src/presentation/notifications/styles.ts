const CSS = `
.wby-notif-bell-wrap { position:relative; display:inline-flex; }
.wby-notif-bell__badge { position:absolute; top:-2px; right:-2px; min-width:16px; height:16px; padding:0 4px; background:var(--color-primary); color:#fff; border-radius:8px; font-size:10px; font-weight:700; line-height:1; display:flex; align-items:center; justify-content:center; box-sizing:border-box; box-shadow:0 0 0 2px var(--color-neutral-0); pointer-events:none; }

.wby-notif-scrim { position:fixed; inset:0; background:rgba(0,0,0,.35); z-index:50; opacity:0; animation:wby-notif-fade .18s ease forwards; }
@keyframes wby-notif-fade { to { opacity:1; } }
.wby-notif-panel { position:fixed; top:0; right:0; height:100vh; width:440px; max-width:100vw; background:var(--color-neutral-0); box-shadow:var(--shadow-xl); z-index:51; display:flex; flex-direction:column; font-family:var(--font-sans); color:var(--text-color-neutral-primary); transform:translateX(100%); animation:wby-notif-slide .22s ease forwards; }
@keyframes wby-notif-slide { to { transform:translateX(0); } }

.wby-notif-header { flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; padding:16px 16px 10px; }
.wby-notif-title { display:flex; align-items:center; gap:8px; font-size:20px; font-weight:600; }
.wby-notif-title__icon { flex:0 0 auto; width:22px; height:22px; fill:var(--color-primary); }
.wby-notif-newbadge { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; background:var(--color-primary-100); color:var(--color-primary-700); border-radius:10px; font-size:12px; font-weight:700; }
.wby-notif-actions { display:flex; align-items:center; gap:2px; }
.wby-notif-iconbtn { display:flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:6px; cursor:pointer; color:var(--color-neutral-500); background:transparent; border:none; padding:0; transition:background .12s ease, color .12s ease; }
.wby-notif-iconbtn:hover { background:var(--color-neutral-100); color:var(--color-neutral-800); }
.wby-notif-iconbtn:not(:disabled) { cursor:pointer; }
.wby-notif-iconbtn:disabled { opacity:.4; cursor:default; }
.wby-notif-iconbtn svg { width:18px; height:18px; fill:currentColor; pointer-events:none; }
.wby-notif-iconbtn--primary { color:var(--color-primary); }
.wby-notif-spin { animation:wby-notif-spin .8s linear infinite; }
@keyframes wby-notif-spin { to { transform:rotate(360deg); } }

.wby-notif-tabs { flex:0 0 auto; display:flex; align-items:center; gap:8px; padding:0 16px 12px; border-bottom:1px solid var(--color-neutral-200); }
.wby-notif-tab { display:inline-flex; align-items:center; gap:6px; padding:6px 12px; border-radius:8px; border:none; background:transparent; cursor:pointer; font-size:14px; font-weight:600; color:var(--color-neutral-600); font-family:inherit; }
.wby-notif-tab.is-active { background:var(--color-neutral-100); color:var(--color-neutral-900); }
.wby-notif-tab__count { color:var(--color-neutral-500); font-weight:600; }
.wby-notif-unreadonly { margin-left:auto; display:flex; align-items:center; gap:6px; font-size:13px; color:var(--color-neutral-700); cursor:pointer; user-select:none; }
.wby-notif-unreadonly input { cursor:pointer; }

.wby-notif-list { flex:1 1 auto; overflow-y:auto; }
.wby-notif-group__label { padding:14px 16px 4px; font-size:12px; font-weight:600; letter-spacing:.04em; text-transform:uppercase; color:var(--color-neutral-500); }
.wby-notif-item { display:flex; gap:12px; padding:14px 16px; border-top:1px solid var(--color-neutral-100); cursor:pointer; position:relative; transition:background .12s ease; }
.wby-notif-item:first-child { border-top:none; }
.wby-notif-item:hover { background:var(--color-neutral-50); }
.wby-notif-item--unread { background:var(--color-primary-100); }
.wby-notif-item--unread:hover { background:var(--color-primary-100); }
.wby-notif-avatar { flex:0 0 auto; width:40px; height:40px; border-radius:50%; color:#fff; font-size:13px; font-weight:600; display:flex; align-items:center; justify-content:center; }
.wby-notif-item__body { flex:1; min-width:0; padding-right:16px; }
.wby-notif-item__text { font-size:14px; line-height:20px; color:var(--color-neutral-900); }
.wby-notif-item__strong { font-weight:700; }
.wby-notif-item__snippet { margin-top:6px; padding-left:10px; border-left:2px solid var(--color-neutral-300); font-size:13px; line-height:18px; color:var(--color-neutral-600); overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
.wby-notif-item__meta { margin-top:8px; display:flex; align-items:center; gap:8px; font-size:12px; color:var(--color-neutral-500); }
.wby-notif-item__typeicon { width:24px; height:24px; border-radius:50%; border:1px solid var(--color-neutral-200); display:flex; align-items:center; justify-content:center; flex:0 0 auto; }
.wby-notif-item__typeicon svg { width:13px; height:13px; fill:var(--color-neutral-500); }
.wby-notif-dot { position:absolute; top:16px; right:16px; width:9px; height:9px; border-radius:50%; background:var(--color-primary); }
.wby-notif-item:hover .wby-notif-dot { display:none; }
.wby-notif-archive { position:absolute; top:10px; right:12px; opacity:0; transition:opacity .12s ease; }
.wby-notif-item:hover .wby-notif-archive { opacity:1; }
.wby-notif-mention { color:var(--color-primary); font-weight:600; }
.wby-notif-empty { padding:48px 24px; text-align:center; color:var(--color-neutral-500); font-size:14px; }
`;

let injected = false;

export const ensureNotifStyles = (): void => {
    if (injected || typeof document === "undefined") {
        return;
    }
    if (document.getElementById("wby-notif-styles")) {
        injected = true;
        return;
    }
    const style = document.createElement("style");
    style.id = "wby-notif-styles";
    style.textContent = CSS;
    document.head.appendChild(style);
    injected = true;
};

ensureNotifStyles();

export const avatarColor = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) % 360;
    }
    return `hsl(${hash} 42% 50%)`;
};

export const initials = (name: string): string => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return "?";
    }
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const DAY_MS = 86_400_000;
const YEAR_MS = 365 * DAY_MS;

export const formatTimestamp = (iso: string): string => {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) {
        return "";
    }
    const diff = Date.now() - then;
    if (diff < DAY_MS) {
        const minutes = Math.floor(diff / 60_000);
        if (minutes < 1) {
            return "just now";
        }
        if (minutes < 60) {
            return `${minutes}m ago`;
        }
        return `${Math.floor(minutes / 60)}h ago`;
    }
    if (diff < 2 * DAY_MS) {
        return "Yesterday";
    }
    const date = new Date(then);
    const options: Intl.DateTimeFormatOptions =
        diff < YEAR_MS
            ? { month: "short", day: "numeric" }
            : { month: "short", day: "numeric", year: "numeric" };
    return date.toLocaleDateString(undefined, options);
};

export interface TimeGroup<T> {
    label: string;
    items: T[];
}

export const groupByTime = <T extends { createdOn: string }>(items: T[]): TimeGroup<T>[] => {
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayStart = startOfToday.getTime();
    const weekStart = now - 7 * DAY_MS;

    const today: T[] = [];
    const week: T[] = [];
    const older: T[] = [];

    for (const item of items) {
        const time = new Date(item.createdOn).getTime();
        if (time >= todayStart) {
            today.push(item);
        } else if (time >= weekStart) {
            week.push(item);
        } else {
            older.push(item);
        }
    }

    return [
        { label: "Today", items: today },
        { label: "Earlier this week", items: week },
        { label: "Older", items: older }
    ].filter(group => group.items.length > 0);
};
