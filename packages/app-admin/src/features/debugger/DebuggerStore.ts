import { makeAutoObservable } from "mobx";

const TOGGLE_STORAGE_KEY = "webiny_debugger_enabled";
const NAMESPACES_STORAGE_KEY = "webiny_debugger_namespaces";

export interface IDebugEntry {
    seq: number;
    namespace: string;
    timestamp: number;
    elapsed: number;
    data: unknown;
}

export interface IDebugPayload {
    enabled: boolean;
    requestId?: string;
    namespaces?: string[];
    operations?: string[];
    entries?: IDebugEntry[];
    bytes?: number;
    dropped?: number;
    truncated?: boolean;
}

export interface ICollectedSession extends IDebugPayload {
    collectedAt: number;
}

const readStorage = (key: string): string | null => {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
};

const writeStorage = (key: string, value: string | null): void => {
    try {
        if (value === null) {
            window.localStorage.removeItem(key);
            return;
        }
        window.localStorage.setItem(key, value);
    } catch {
        // Private windows and blocked site data both throw. The toggle simply will not persist.
    }
};

/**
 * Holds the debug toggle and the sessions collected from responses.
 *
 * The toggle persists across reloads, because reproducing a bug often involves one. The collected
 * sessions deliberately do not: they hold customer data, and leaving that in browser storage after
 * the session is a worse exposure than the response itself, which is transient.
 */
export class DebuggerStore {
    private _enabled: boolean;
    private _namespaces: string;
    private _sessions: ICollectedSession[] = [];

    public constructor() {
        this._enabled = readStorage(TOGGLE_STORAGE_KEY) === "true";
        this._namespaces = readStorage(NAMESPACES_STORAGE_KEY) || "*";
        makeAutoObservable(this);
    }

    public get enabled(): boolean {
        return this._enabled;
    }

    public get namespaces(): string {
        return this._namespaces;
    }

    public get sessions(): ICollectedSession[] {
        return this._sessions;
    }

    public get entryCount(): number {
        return this._sessions.reduce((total, session) => {
            return total + (session.entries?.length || 0);
        }, 0);
    }

    /**
     * True when the server reported that capture is not available for this identity. Surfaced so the
     * panel can say so, rather than showing an empty list that looks like a broken feature.
     */
    public get denied(): boolean {
        return this._sessions.length > 0 && this._sessions.every(session => !session.enabled);
    }

    public setEnabled = (enabled: boolean): void => {
        this._enabled = enabled;
        writeStorage(TOGGLE_STORAGE_KEY, enabled ? "true" : null);
    };

    public setNamespaces = (namespaces: string): void => {
        this._namespaces = namespaces;
        writeStorage(NAMESPACES_STORAGE_KEY, namespaces || null);
    };

    public collect = (payload: IDebugPayload): void => {
        this._sessions.push({ ...payload, collectedAt: Date.now() });
    };

    public clear = (): void => {
        this._sessions = [];
    };
}

/**
 * A single store instance, read by the Apollo link on every request and by the panel.
 */
export const debuggerStore = new DebuggerStore();
