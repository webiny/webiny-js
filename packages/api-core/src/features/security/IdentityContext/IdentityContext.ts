import { AsyncLocalStorage } from "async_hooks";
import minimatch from "minimatch";
import { createImplementation } from "@webiny/di-container";
import { IdentityContext as Abstraction } from "./abstractions.js";
import { Identity } from "./Identity.js";
import { AnonymousIdentity } from "./AnonymousIdentity.js";
import { AuthorizationContext } from "~/features/security/authorization/AuthorizationContext/index.js";
import { filterOutCustomWbyAppsPermissions } from "~/features/security/utils/filterOutCustomWbyAppsPermissions.js";
import type { SecurityPermission } from "~/types/security.js";
import type { AaclPermission } from "~/features/wcp/WcpContext/types.js";
import { WcpContext } from "~/features/wcp/WcpContext/index.js";

const identityStorage = new AsyncLocalStorage<Identity | undefined>();

class IdentityContextImpl implements Abstraction.Interface {
    private identity: Identity = new AnonymousIdentity();

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
        return this.identity;
    }

    setIdentity(identity: Identity | undefined): void {
        // If undefined, set to anonymous identity
        this.identity = identity ?? new AnonymousIdentity();

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
        const permissions = await this.authorizationContext.loadPermissions();
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
            permissions.push({
                name: "aacl",
                teams: teamsEnabled
            } as AaclPermission);

            return permissions;
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
