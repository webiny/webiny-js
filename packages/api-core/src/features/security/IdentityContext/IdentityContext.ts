import { AsyncLocalStorage } from "node:async_hooks";
import { minimatch } from "minimatch";
import { createImplementation } from "@webiny/di";
import { HandlerExecution } from "@webiny/event-handler-core";
import { IdentityContext as Abstraction } from "./abstractions.js";
import { Identity } from "./Identity.js";
import { AnonymousIdentity } from "./AnonymousIdentity.js";
import { AuthorizationContext } from "../authorization/AuthorizationContext/index.js";
import { filterOutCustomWbyAppsPermissions } from "../utils/filterOutCustomWbyAppsPermissions.js";
import type { SecurityPermission } from "~/types/security.js";
import type { AaclPermission } from "../../wcp/WcpContext/types.js";
import { FeatureFlags } from "../../featureFlags/abstractions.js";

class IdentityContextImpl implements Abstraction.Interface {
    private identity: Identity = new AnonymousIdentity();
    /*
     * `withIdentity()` switches the identity for its callback's async call chain only, the same way
     * `TenantContext.withTenant()` switches the tenant.
     */
    private readonly overrides = new AsyncLocalStorage<Identity>();

    constructor(
        private authorizationContext: AuthorizationContext.Interface,
        private featureFlags: FeatureFlags.Interface,
        private handlerExecution: HandlerExecution.Interface | undefined
    ) {}

    // ========================================================================
    // Identity Methods
    // ========================================================================

    getIdentity(): Identity {
        this.handlerExecution?.assertCurrent("IdentityContext");

        const override = this.overrides.getStore();
        if (override) {
            return override;
        }
        return this.identity;
    }

    /*
     * Sets the request's identity. Inside a `withIdentity()` callback it throws: the callback would
     * keep reading its own identity, and the change would only show once the callback ended, in the
     * rest of the request.
     */
    setIdentity(identity: Identity | undefined): void {
        this.handlerExecution?.assertCurrent("IdentityContext");

        if (this.overrides.getStore()) {
            throw new Error(
                "IdentityContext.setIdentity() was called inside a withIdentity() callback. Call withIdentity() instead, so the switch stays inside its own callback."
            );
        }

        // If undefined, set to anonymous identity
        this.identity = identity ?? new AnonymousIdentity();

        // Clear permissions cache when identity changes
        this.authorizationContext.clearPermissionsCache();
    }

    withIdentity<T>(identity: Identity, cb: () => Promise<T>): Promise<T> {
        this.handlerExecution?.assertCurrent("IdentityContext");
        return this.overrides.run(identity, cb);
    }

    // ========================================================================
    // Authorization State Methods
    // ========================================================================

    withoutAuthorization<T>(cb: () => Promise<T>): Promise<T> {
        this.handlerExecution?.assertCurrent("IdentityContext");
        return this.authorizationContext.withoutAuthorization(cb);
    }

    withAuthorization<T>(cb: () => Promise<T>): Promise<T> {
        this.handlerExecution?.assertCurrent("IdentityContext");
        return this.authorizationContext.withAuthorization(cb);
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
        const aaclEnabled = this.featureFlags.get().isEnabled("advancedAccessControlLayer");
        const teamsEnabled = this.featureFlags.get().isEnabled("advancedAccessControlLayer.teams");

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
    dependencies: [AuthorizationContext, FeatureFlags, [HandlerExecution, { optional: true }]]
});
