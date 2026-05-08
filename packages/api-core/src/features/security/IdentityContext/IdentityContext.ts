import { AsyncLocalStorage } from "async_hooks";
import { minimatch } from "minimatch";
import { createImplementation } from "@webiny/di";
import { IdentityContext as Abstraction } from "./abstractions.js";
import { Identity } from "./Identity.js";
import { AnonymousIdentity } from "./AnonymousIdentity.js";
import { AuthorizationContext } from "../authorization/AuthorizationContext/index.js";
import { filterOutCustomWbyAppsPermissions } from "../utils/filterOutCustomWbyAppsPermissions.js";
import type { SecurityPermission } from "~/types/security.js";
import type { AaclPermission } from "../../wcp/WcpContext/types.js";
import { WcpContext } from "../../wcp/WcpContext/index.js";

// `withIdentity` overrides the identity via ALS for the duration of a
// callback; that pre-existing storage covers single-callback overrides.
const identityStorage = new AsyncLocalStorage<Identity | undefined>();

// Per-request identity store. `setIdentity` writes to whichever
// store is active (request-scoped if `requestIdentityStorage.run` /
// `enterWith` was called by the host, otherwise the instance-level
// `fallbackIdentity` slot). This keeps `IdentityContext` safe to
// share as a DI singleton in long-lived hosts where concurrent
// requests would otherwise overwrite each other's identity. Lambda
// deployments, which run one request per process, see the original
// behavior because no `requestIdentityStorage` scope is active and
// reads/writes go through the fallback slot.
const requestIdentityStorage = new AsyncLocalStorage<{ identity: Identity }>();

class IdentityContextImpl implements Abstraction.Interface {
    private fallbackIdentity: Identity = new AnonymousIdentity();

    constructor(
        private authorizationContext: AuthorizationContext.Interface,
        private wcpContext: WcpContext.Interface
    ) {}

    // ========================================================================
    // Identity Methods
    // ========================================================================

    getIdentity(): Identity {
        // Check for identity override first (from withIdentity())
        const override = identityStorage.getStore();
        if (override !== undefined) {
            return override;
        }
        const requestStore = requestIdentityStorage.getStore();
        if (requestStore) {
            return requestStore.identity;
        }
        return this.fallbackIdentity;
    }

    setIdentity(identity: Identity | undefined): void {
        const next = identity ?? new AnonymousIdentity();
        const requestStore = requestIdentityStorage.getStore();
        if (requestStore) {
            requestStore.identity = next;
        } else {
            this.fallbackIdentity = next;
        }

        // Clear permissions cache when identity changes
        this.authorizationContext.clearPermissionsCache();
    }

    withIdentity<T>(identity: Identity | undefined, cb: () => Promise<T>): Promise<T> {
        return identityStorage.run(identity, cb);
    }

    // ========================================================================
    // Authorization State Methods
    // ========================================================================

    withoutAuthorization<T>(cb: () => Promise<T>): Promise<T> {
        return this.authorizationContext.withoutAuthorization(cb);
    }

    isAuthorizationEnabled(): boolean {
        return this.authorizationContext.isAuthorizationEnabled();
    }

    // ========================================================================
    // Permission Methods
    // ========================================================================

    async getPermission<TPermission extends SecurityPermission = SecurityPermission>(
        name: string
    ): Promise<TPermission | null> {
        if (!this.isAuthorizationEnabled()) {
            return { name: "*" } as TPermission;
        }

        const permissions = await this.listPermissions();

        // Try exact match first
        const exactMatch = permissions.find(p => p.name === name);
        if (exactMatch) {
            return exactMatch as TPermission;
        }

        // Try pattern matching
        const patternMatch = permissions.find(p => minimatch(name, p.name));
        if (patternMatch) {
            return patternMatch as TPermission;
        }

        return null;
    }

    async getPermissions<TPermission extends SecurityPermission = SecurityPermission>(
        name: string
    ): Promise<TPermission[]> {
        if (!this.isAuthorizationEnabled()) {
            return [{ name: "*" }] as TPermission[];
        }

        const permissions = await this.listPermissions();

        return permissions.filter(p => {
            if (p.name === name) {
                return true;
            }
            return minimatch(name, p.name);
        }) as TPermission[];
    }

    async listPermissions(): Promise<SecurityPermission[]> {
        const permissions = await this.authorizationContext.loadPermissions(this.getIdentity());
        // TODO: extract this into a decorator
        return this.applyAaclLogic(permissions);
    }

    async hasFullAccess(): Promise<boolean> {
        const permissions = await this.listPermissions();
        return permissions.some(p => p.name === "*");
    }

    // ========================================================================
    // Private Helper Methods
    // ========================================================================

    private applyAaclLogic(permissions: SecurityPermission[]): SecurityPermission[] {
        const aaclEnabled = this.wcpContext.canUseAacl();
        const teamsEnabled = this.wcpContext.canUseTeams();

        if (aaclEnabled) {
            // Add AACL metadata permission
            return [
                ...permissions,
                {
                    name: "aacl",
                    teams: teamsEnabled
                } as AaclPermission
            ];
        }

        // If AACL is not enabled, filter out custom Webiny apps permissions
        return filterOutCustomWbyAppsPermissions(permissions);
    }
}

export const IdentityContext = createImplementation({
    abstraction: Abstraction,
    implementation: IdentityContextImpl,
    dependencies: [AuthorizationContext, WcpContext]
});

/**
 * Open a per-request identity scope. Long-lived hosts (the
 * container deployment via `@webiny/handler-node`) call this once at
 * the top of every HTTP request so that `setIdentity` writes don't
 * leak across concurrent requests sharing the singleton
 * `IdentityContext`. Outside any scope, the singleton's instance
 * field is used — preserving the legacy single-request-per-process
 * behavior (Lambda, tests).
 */
export const enterIdentityRequestScope = (): void => {
    requestIdentityStorage.enterWith({ identity: new AnonymousIdentity() });
};
