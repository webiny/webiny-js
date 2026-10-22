import { makeAutoObservable } from "mobx";
import { LocalStorage } from "@webiny/app/features/localStorage";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { DebugSessionsRepository as Abstraction } from "./abstractions.js";
import { DEBUG_PERMISSION } from "./constants.js";

const TOGGLE_STORAGE_KEY = "debugger/enabled";

/**
 * The toggle persists across reloads, because reproducing a bug often involves one. The collected
 * sessions deliberately do not: they hold customer data, and leaving that in browser storage after
 * the session is a worse exposure than the response itself, which is transient.
 */
class DebugSessionsRepositoryImpl implements Abstraction.Interface {
    private sessions: Abstraction.Session[] = [];

    constructor(
        private identityContext: IdentityContext.Interface,
        private localStorage: LocalStorage.Interface
    ) {
        makeAutoObservable<DebugSessionsRepositoryImpl, "identityContext" | "localStorage">(
            this,
            { identityContext: false, localStorage: false },
            { autoBind: true }
        );
    }

    /**
     * An exact match, deliberately: `*` and `dev-tools.*` do not grant it. The API captures for
     * whoever holds this, so a wildcard would leave capture permanently on for every full-access
     * administrator, collecting record content on every request for people who never asked for it.
     */
    canCapture(): boolean {
        const identity = this.identityContext.getIdentity();
        return Boolean(identity.getPermission(DEBUG_PERMISSION, true));
    }

    /**
     * Holding the permission is the opt-in: it is granted deliberately, for a support session, and
     * nobody should then have to find a second switch before the problem they were asked to
     * reproduce is captured. An identity that turned capture off keeps it off.
     */
    isCaptureOn(): boolean {
        if (!this.canCapture()) {
            return false;
        }
        const choice = this.localStorage.get<boolean>(TOGGLE_STORAGE_KEY);
        return choice !== false;
    }

    setCaptureOn(enabled: boolean): void {
        this.localStorage.set(TOGGLE_STORAGE_KEY, enabled);
    }

    getSessions(): Abstraction.Session[] {
        return this.sessions;
    }

    getEntryCount(): number {
        return this.sessions.reduce((total, session) => {
            return total + (session.entries?.length || 0);
        }, 0);
    }

    collect(payload: Abstraction.Payload): void {
        /*
         * The API already omits sessions that captured nothing. This guards the case where a
         * response carries an envelope with no entries anyway: there is nothing to read in it, and
         * it would only pad the report.
         */
        if (!payload.entries?.length) {
            return;
        }

        this.sessions.push({ ...payload, collectedAt: Date.now() });
    }

    clear(): void {
        this.sessions = [];
    }
}

export const DebugSessionsRepository = Abstraction.createImplementation({
    implementation: DebugSessionsRepositoryImpl,
    dependencies: [IdentityContext, LocalStorage]
});
