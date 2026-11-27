import { minimatch } from "minimatch";
import { AsyncLocalStorage } from "async_hooks";
import { createImplementation } from "@webiny/di";
import { IdentityContext as Abstraction } from "./abstractions.js";
import { Identity } from "./Identity.js";
import { AnonymousIdentity } from "./AnonymousIdentity.js";
import { AuthorizationContext } from "../authorization/AuthorizationContext/index.js";
import { applyAaclLogic } from "../utils/applyAaclLogic.js";
import { filterPermissionsByName } from "../utils/filterPermissionsByName.js";
import type { SecurityPermission } from "~/types/security.js";
import { WcpContext } from "../../wcp/WcpContext/index.js";

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

        return filterPermissionsByName<TPermission>(permissions, name);
    }

    async listPermissions(): Promise<SecurityPermission[]> {
        const permissions = await this.authorizationContext.loadPermissions(this.getIdentity());
        // TODO: extract this into a decorator
        const aaclEnabled = this.wcpContext.canUseAacl();
        const teamsEnabled = this.wcpContext.canUseTeams();

        return applyAaclLogic(permissions, { aaclEnabled, teamsEnabled });
    }

    async hasFullAccess(): Promise<boolean> {
        const permissions = await this.listPermissions();
        return permissions.some(p => p.name === "*");
    }
}

export const IdentityContext = createImplementation({
    abstraction: Abstraction,
    implementation: IdentityContextImpl,
    dependencies: [AuthorizationContext, WcpContext]
});
