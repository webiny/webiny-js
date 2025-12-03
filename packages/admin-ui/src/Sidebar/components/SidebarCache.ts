import { SIDEBAR_LS_KEY } from "./constants.js";

type CachedSidebarState = {
    pinned: boolean;
    expandedSections: string[];
};

const DEFAULT_CACHED_STATE: CachedSidebarState = {
    pinned: false,
    expandedSections: []
};

export class SidebarCache {
    static get(): CachedSidebarState {
        const item = window.localStorage.getItem(SIDEBAR_LS_KEY);
        if (!item) {
            return DEFAULT_CACHED_STATE;
        }

        try {
            return JSON.parse(item) || DEFAULT_CACHED_STATE;
        } catch {
            return DEFAULT_CACHED_STATE;
        }
    }

    static set(state: CachedSidebarState) {
        window.localStorage.setItem(SIDEBAR_LS_KEY, JSON.stringify(state));
    }
}
