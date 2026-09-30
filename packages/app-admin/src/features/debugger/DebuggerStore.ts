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
    url?: string;
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
        /**
         * Absent means "no choice made yet", which is different from an explicit "off" - the first
         * decides whether the permission turns capture on, the second must survive it.
         */
        this._enabled = readStorage(TOGGLE_STORAGE_KEY) === "true";
        this._namespaces = readStorage(NAMESPACES_STORAGE_KEY) || "*";
        makeAutoObservable(this);
    }

    /**
     * Turns capture on for an identity that holds the permission, unless they have already turned it
     * off themselves.
     *
     * Holding `dev-tools.debug` is the opt-in: the permission is granted deliberately, for a support
     * session, and nobody should then have to find a second switch before the thing they were asked
     * to reproduce is captured.
     */
    public applyPermission = (canCapture: boolean): void => {
        if (!canCapture) {
            this._enabled = false;
            return;
        }

        if (readStorage(TOGGLE_STORAGE_KEY) === null) {
            this._enabled = true;
        }
    };

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

    public setEnabled = (enabled: boolean): void => {
        this._enabled = enabled;
        writeStorage(TOGGLE_STORAGE_KEY, enabled ? "true" : "false");
    };

    public setNamespaces = (namespaces: string): void => {
        this._namespaces = namespaces;
        writeStorage(NAMESPACES_STORAGE_KEY, namespaces || null);
    };

    public collect = (payload: IDebugPayload): void => {
        /**
         * The server already omits sessions that captured nothing. This guards the case where a
         * response carries an envelope with no entries anyway - there is nothing to read in it, and
         * it would only pad the report.
         */
        if (!payload.entries?.length) {
            return;
        }

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
