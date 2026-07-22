/**
 * Collaboration panel styles, injected once. Uses the admin theme CSS variables (same tokens the
 * design mockup uses) so hover states, focus rings, transitions and keyframes are possible —
 * which inline styles cannot express.
 */
const CSS = `
.wby-collab-panel { display:flex; flex-direction:column; height:100%; background:var(--color-neutral-0); border-left:1px solid var(--color-neutral-200); font-family:var(--font-sans); color:var(--text-color-neutral-primary); }
.wby-collab-panel__header { flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; padding:14px 16px 12px; border-bottom:1px solid var(--color-neutral-200); }
.wby-collab-panel__title { display:flex; align-items:center; gap:8px; }
.wby-collab-panel__title-text { font-size:15px; font-weight:600; }
.wby-collab-count { display:inline-flex; align-items:center; justify-content:center; min-width:20px; height:20px; padding:0 6px; background:var(--color-neutral-100); border-radius:10px; font-size:12px; font-weight:600; color:var(--color-neutral-600); }
.wby-collab-actions { display:flex; align-items:center; gap:2px; }

.wby-collab-iconbtn { display:flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:6px; cursor:pointer; color:var(--color-neutral-500); background:transparent; border:none; padding:0; transition:background .12s ease, color .12s ease; }
.wby-collab-iconbtn:hover { background:var(--color-neutral-100); color:var(--color-neutral-800); }
.wby-collab-iconbtn svg { width:18px; height:18px; fill:currentColor; }

.wby-collab-overview { flex:0 0 auto; display:flex; align-items:center; gap:8px; padding:10px 16px; background:var(--color-neutral-50); border-bottom:1px solid var(--color-neutral-200); font-size:13px; }
.wby-collab-overview__count { display:inline-flex; align-items:center; gap:6px; font-weight:600; color:var(--color-neutral-800); }
.wby-collab-dot { width:8px; height:8px; border-radius:50%; background:var(--color-primary); display:inline-block; }
.wby-collab-overview__sep { color:var(--color-neutral-400); }
.wby-collab-overview__fields { color:var(--color-neutral-500); }
.wby-collab-sort { margin-left:auto; display:flex; align-items:center; gap:4px; font-weight:600; color:var(--color-neutral-600); background:none; border:none; cursor:pointer; font-size:13px; font-family:inherit; padding:0; }
.wby-collab-sort svg { width:16px; height:16px; fill:currentColor; }

.wby-collab-list { flex:1 1 auto; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:18px; }

.wby-collab-chip { display:inline-flex; align-items:center; gap:6px; padding:3px 10px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer; border:none; background:var(--color-neutral-100); color:var(--color-neutral-700); transition:background .12s ease; max-width:100%; font-family:inherit; }
.wby-collab-chip:hover { background:var(--color-neutral-200); }
.wby-collab-chip--active { background:var(--color-primary-100); color:var(--color-primary-700); cursor:default; }
.wby-collab-chip--entry { background:var(--color-neutral-100); color:var(--color-neutral-600); cursor:default; }
.wby-collab-chip--entry:hover { background:var(--color-neutral-100); }
.wby-collab-chip__x { display:inline-flex; align-items:center; justify-content:center; width:16px; height:16px; margin-left:2px; padding:0; border:none; background:transparent; color:inherit; cursor:pointer; border-radius:4px; transition:background .12s ease; }
.wby-collab-chip__x:hover { background:var(--color-primary-200); }
.wby-collab-chip__x svg { width:12px; height:12px; fill:currentColor; }
.wby-collab-chip__label { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.wby-collab-chip__jump { width:14px; height:14px; fill:var(--color-neutral-500); flex:0 0 auto; }

.wby-collab-thread { border:1px solid var(--color-neutral-200); border-radius:10px; padding:12px 12px 8px; display:flex; flex-direction:column; gap:12px; transition:box-shadow .12s ease, border-color .12s ease; }
.wby-collab-thread:hover { box-shadow:var(--shadow-sm); border-color:var(--color-neutral-300); }
.wby-collab-thread--resolved { opacity:.72; }
.wby-collab-thread--resolved:hover { opacity:1; }
.wby-collab-thread__head { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.wby-collab-thread__head-actions { display:flex; align-items:center; gap:6px; position:relative; }

.wby-collab-pillbtn { display:flex; align-items:center; gap:5px; height:28px; padding:0 10px; border:1px solid var(--color-neutral-300); background:var(--color-neutral-0); border-radius:14px; font-size:12px; font-weight:600; color:var(--color-neutral-700); cursor:pointer; transition:background .12s ease, border-color .12s ease; font-family:inherit; }
.wby-collab-pillbtn:hover { background:var(--color-neutral-100); }
.wby-collab-pillbtn svg { width:16px; height:16px; }
.wby-collab-pillbtn svg.wby-collab-ok { fill:var(--color-success-600); }

.wby-collab-menu { position:absolute; top:34px; right:0; width:190px; background:var(--color-neutral-0); border:1px solid var(--color-neutral-200); border-radius:8px; box-shadow:var(--shadow-lg); padding:4px; z-index:10; transform-origin:top right; animation:wby-collab-menu-in .12s ease; }
@keyframes wby-collab-menu-in { from { opacity:0; transform:scale(.97) translateY(-4px); } to { opacity:1; transform:scale(1) translateY(0); } }
.wby-collab-menuitem { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:6px; font-size:13px; font-weight:500; color:var(--color-neutral-800); cursor:pointer; background:none; border:none; width:100%; text-align:left; font-family:inherit; }
.wby-collab-menuitem:hover { background:var(--color-neutral-100); }
.wby-collab-menuitem svg { width:18px; height:18px; fill:var(--color-neutral-600); flex:0 0 auto; }
.wby-collab-menuitem svg.wby-collab-ok { fill:var(--color-success-600); }
.wby-collab-menuitem--danger { color:var(--color-destructive); }
.wby-collab-menuitem--danger svg { fill:var(--color-destructive); }
.wby-collab-menuitem--danger:hover { background:var(--color-destructive-100); }
.wby-collab-menu--compact { top:28px; width:152px; }
.wby-collab-menu__divider { height:1px; background:var(--color-neutral-200); margin:4px 6px; }
.wby-collab-backdrop { position:fixed; inset:0; z-index:9; }

.wby-collab-msg { display:flex; gap:10px; }
.wby-collab-avatar { flex:0 0 auto; width:28px; height:28px; border-radius:50%; color:#fff; font-size:11px; font-weight:600; display:flex; align-items:center; justify-content:center; }
.wby-collab-avatar--sm { width:24px; height:24px; font-size:10px; }
.wby-collab-msg__main { flex:1; min-width:0; }
.wby-collab-msg__meta { display:flex; align-items:center; gap:6px; min-height:24px; }
.wby-collab-msg__name { font-size:13px; font-weight:600; }
.wby-collab-msg__right { margin-left:auto; display:flex; align-items:center; gap:4px; padding-left:8px; }
.wby-collab-msg__time { font-size:12px; color:var(--color-neutral-500); white-space:nowrap; }
.wby-collab-msg__menu-anchor { display:none; position:relative; align-items:center; }
.wby-collab-msg--manageable:hover .wby-collab-msg__time { display:none; }
.wby-collab-msg--manageable:hover .wby-collab-msg__menu-anchor { display:flex; }
.wby-collab-msg.is-menu-open .wby-collab-msg__time { display:none; }
.wby-collab-msg.is-menu-open .wby-collab-msg__menu-anchor { display:flex; }
.wby-collab-msgbtn { display:flex; align-items:center; justify-content:center; width:24px; height:24px; border:none; background:transparent; color:var(--color-neutral-500); border-radius:4px; cursor:pointer; padding:0; transition:background .12s ease, color .12s ease; }
.wby-collab-msgbtn:hover { background:var(--color-neutral-100); color:var(--color-neutral-800); }
.wby-collab-msgbtn svg { width:14px; height:14px; fill:currentColor; }
.wby-collab-msg__edit { display:flex; flex-direction:column; gap:6px; margin-top:4px; }
.wby-collab-msg__edit-actions { display:flex; gap:6px; justify-content:flex-end; }
.wby-collab-msg__body { font-size:14px; line-height:20px; color:var(--color-neutral-800); margin-top:2px; overflow-wrap:anywhere; }
.wby-collab-msg__body--resolved { text-decoration:line-through; text-decoration-color:var(--color-neutral-400); }
.wby-collab-reply { padding-left:10px; border-left:2px solid var(--color-neutral-200); margin-left:14px; }
.wby-collab-resolved-by { font-size:12px; color:var(--color-neutral-500); }

.wby-collab-replybar { display:flex; align-items:center; gap:8px; padding:2px 0 4px; }
.wby-collab-input { flex:1; height:32px; padding:0 12px; font-size:13px; border:1px solid var(--color-neutral-300); border-radius:16px; outline:none; font-family:inherit; transition:border-color .12s ease, box-shadow .12s ease; background:var(--color-neutral-0); }
.wby-collab-input:focus { border-color:var(--color-primary); box-shadow:0 0 0 3px var(--color-primary-200); }

.wby-collab-composer { display:flex; flex-direction:column; gap:10px; }
.wby-collab-composer__box { border:2px solid var(--color-neutral-300); border-radius:10px; padding:12px; box-shadow:none; display:flex; flex-direction:column; gap:10px; transition:border-color .15s ease, box-shadow .15s ease; }
.wby-collab-composer__box:hover, .wby-collab-composer__box:focus-within { border-color:var(--color-primary); box-shadow:0 0 0 4px var(--color-primary-200); }
.wby-collab-composer__row { display:flex; gap:10px; }
.wby-collab-textarea { flex:1; min-height:44px; border:none; outline:none; resize:none; overflow-y:hidden; font-size:14px; line-height:20px; font-family:inherit; color:var(--color-neutral-900); background:transparent; padding:4px 0; box-sizing:border-box; }
.wby-collab-reply-input { width:100%; min-height:32px; box-sizing:border-box; padding:6px 12px; font-size:13px; line-height:18px; border:1px solid var(--color-neutral-300); border-radius:16px; outline:none; font-family:inherit; resize:none; overflow-y:hidden; background:var(--color-neutral-0); transition:border-color .12s ease, box-shadow .12s ease; }
.wby-collab-reply-input:focus { border-color:var(--color-primary); box-shadow:0 0 0 3px var(--color-primary-200); }
.wby-collab-composer__actions { display:flex; justify-content:flex-end; gap:8px; align-items:center; }
.wby-collab-btn { height:30px; padding:0 14px; border:none; border-radius:6px; font-size:13px; font-weight:600; cursor:pointer; transition:background .12s ease; font-family:inherit; }
.wby-collab-btn--primary { background:var(--color-primary); color:#fff; }
.wby-collab-btn--primary:hover { background:var(--color-primary-700, var(--color-primary)); }
.wby-collab-btn--primary:disabled { opacity:.55; cursor:default; }
.wby-collab-btn--ghost { background:transparent; color:var(--color-neutral-600); }
.wby-collab-btn--ghost:hover { background:var(--color-neutral-100); }
.wby-collab-select { height:30px; border-radius:6px; border:1px solid var(--color-neutral-300); padding:0 8px; font-size:13px; font-family:inherit; background:var(--color-neutral-0); color:var(--color-neutral-800); max-width:100%; }

.wby-collab-section { display:flex; align-items:center; gap:6px; cursor:pointer; color:var(--color-neutral-600); user-select:none; background:none; border:none; padding:0; font-family:inherit; }
.wby-collab-section svg { width:18px; height:18px; fill:currentColor; transition:transform .15s ease; }
.wby-collab-section__label { font-size:12px; font-weight:600; letter-spacing:.03em; text-transform:uppercase; }
.wby-collab-group { display:flex; flex-direction:column; gap:12px; }

.wby-collab-banner { display:flex; align-items:center; gap:6px; padding:6px 8px; background:var(--color-warning-100); border-radius:6px; font-size:12px; color:var(--color-warning-700); }
.wby-collab-banner svg { width:15px; height:15px; fill:currentColor; flex:0 0 auto; }

.wby-collab-error { color:var(--color-destructive); font-size:13px; background:var(--color-destructive-100); padding:8px 10px; border-radius:6px; }
.wby-collab-empty { color:var(--color-neutral-500); font-size:13px; text-align:center; padding:24px 0; }

.wby-collab-mention { color:var(--color-primary); font-weight:600; }

.wby-collab-mention-wrap { position:relative; flex:1; min-width:0; }
.wby-collab-mention-wrap textarea { width:100%; box-sizing:border-box; }
.wby-collab-mention-menu { position:absolute; left:0; top:calc(100% + 4px); width:100%; max-height:220px; overflow-y:auto; background:var(--color-neutral-0); border:1px solid var(--color-neutral-200); border-radius:8px; box-shadow:var(--shadow-lg); padding:4px; z-index:20; }
.wby-collab-mention-item { display:flex; align-items:center; gap:8px; width:100%; padding:6px 8px; border:none; background:none; cursor:pointer; border-radius:6px; text-align:left; font-family:inherit; }
.wby-collab-mention-item:hover, .wby-collab-mention-item.is-active { background:var(--color-neutral-100); }
.wby-collab-mention-item__main { display:flex; flex-direction:column; min-width:0; }
.wby-collab-mention-item__name { font-size:13px; font-weight:600; color:var(--color-neutral-900); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.wby-collab-mention-item__email { font-size:11px; color:var(--color-neutral-500); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

/* In-form per-field markers */
.wby-collab-field { position:relative; }
.wby-collab-marker { position:absolute; top:-7px; right:8px; display:inline-flex; align-items:center; gap:5px; height:26px; padding:0 10px; border-radius:13px; cursor:pointer; font-size:12px; font-weight:600; box-shadow:var(--shadow-md); background:var(--color-neutral-0); border:1px solid var(--color-neutral-300); z-index:3; }
.wby-collab-marker svg { width:15px; height:15px; }
.wby-collab-marker--add { color:var(--color-primary); opacity:0; transform:translateY(3px); transition:opacity .12s ease, transform .12s ease, background .12s ease; }
.wby-collab-field:hover .wby-collab-marker--add { opacity:1; transform:translateY(0); }
.wby-collab-marker--add:hover { background:var(--color-neutral-50); }
.wby-collab-marker--add svg { fill:var(--color-primary); }
.wby-collab-marker--count { color:var(--color-neutral-800); }
.wby-collab-marker--count svg { fill:var(--color-neutral-600); }
.wby-collab-marker__badge { display:inline-flex; align-items:center; justify-content:center; min-width:16px; height:16px; padding:0 4px; background:var(--color-primary); color:#fff; border-radius:8px; font-size:10px; font-weight:700; }
`;

let injected = false;

export const ensureCollabStyles = (): void => {
    if (injected || typeof document === "undefined") {
        return;
    }
    if (document.getElementById("wby-collab-styles")) {
        injected = true;
        return;
    }
    const style = document.createElement("style");
    style.id = "wby-collab-styles";
    style.textContent = CSS;
    document.head.appendChild(style);
    injected = true;
};

// Inject on import.
ensureCollabStyles();

/** Deterministic avatar color from a display name. */
export const avatarColor = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) % 360;
    }
    return `hsl(${hash} 42% 50%)`;
};

const DAY_MS = 86_400_000;
const YEAR_MS = 365 * DAY_MS;

/**
 * Formats a comment timestamp:
 *  - < 24h ago  -> relative ("just now", "5m ago", "3h ago")
 *  - < 12 months -> short date ("Jun 25")
 *  - otherwise   -> short date with year ("Jun 25, 2026")
 */
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

    const date = new Date(then);
    const options: Intl.DateTimeFormatOptions =
        diff < YEAR_MS
            ? { month: "short", day: "numeric" }
            : { month: "short", day: "numeric", year: "numeric" };
    return date.toLocaleDateString(undefined, options);
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
