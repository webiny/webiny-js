import type { Container } from "@webiny/di-container";
import type { Security, SecurityIdentity, SecurityPermission, TenantLink } from "~/types.js";
import {
    AuthenticationContext,
    Authenticator as AuthenticatorAbstraction
} from "~/features/authentication/index.js";
import { Authorizer } from "../features/authorization/shared/abstractions.js";
import { AuthenticatedIdentity, IdentityContext } from "~/features/IdentityContext/index.js";
import type { Authenticator } from "@webiny/api-authentication/types.js";

/**
 * Legacy bridge that implements the old Security interface.
 *
 * Strategy:
 * - Phase 1 (Identity/Auth): Delegate to new IdentityContext and AuthenticationContext
 * - Everything else: Forward to old security context object
 *
 * As we implement each phase, we'll replace forwarding with delegation.
 */
export class LegacyContext implements Security {
    constructor(
        private container: Container,
        private oldSecurity: Security
    ) {}

    private get identityContext() {
        return this.container.resolve(IdentityContext);
    }

    private get authenticationContext() {
        return this.container.resolve(AuthenticationContext);
    }

    // ===== LEGACY
    addAuthenticator(authenticator: Authenticator<SecurityIdentity>): void {
        // @ts-expect-error This will go away after full refactor.
        this.container.registerFactory(AuthenticatorAbstraction, () => {
            return {
                authenticate(token: string): Promise<SecurityIdentity | null> {
                    return authenticator(token);
                }
            };
        });
    }

    getAuthenticators(): Authenticator[] {
        return this.container.resolveAll(AuthenticatorAbstraction).map(authenticator => {
            return (token: string) => authenticator.authenticate(token);
        });
    }

    // ========================================================================
    // Phase 1: Identity & Authentication (NEW IMPLEMENTATION)
    // ========================================================================

    async authenticate(token: string): Promise<void> {
        // Authenticate using new context
        const identity = await this.authenticationContext.authenticate(token);

        // Set identity in IdentityContext
        this.identityContext.setIdentity(identity);
    }

    getIdentity<TIdentity extends SecurityIdentity = SecurityIdentity>(): TIdentity {
        const identity = this.identityContext.getIdentity();

        // Convert our Identity class to old SecurityIdentity format
        if (identity.isAnonymous()) {
            return undefined as any;
        }

        // Return the underlying data from AuthenticatedIdentity
        if (identity instanceof AuthenticatedIdentity) {
            return identity.getData() as TIdentity;
        }

        // Fallback
        return {
            id: identity.id,
            displayName: identity.displayName,
            type: identity.type
        } as TIdentity;
    }

    setIdentity(identity: SecurityIdentity): void {
        if (!identity) {
            this.identityContext.setIdentity(undefined);
            return;
        }

        // Wrap old identity format in AuthenticatedIdentity
        const { id, displayName, type, ...rest } = identity;
        const authenticatedIdentity = new AuthenticatedIdentity({
            id,
            displayName,
            type,
            ...rest
        });

        this.identityContext.setIdentity(authenticatedIdentity);
    }

    getToken() {
        return this.authenticationContext.getAuthToken();
    }

    isAuthorizationEnabled(): boolean {
        return this.identityContext.isAuthorizationEnabled();
    }

    withoutAuthorization<T = any>(cb: () => Promise<T>): Promise<T> {
        return this.identityContext.withoutAuthorization(cb);
    }

    withIdentity<T = any>(
        identity: SecurityIdentity | undefined,
        cb: () => Promise<T>
    ): Promise<T> {
        if (!identity) {
            return this.identityContext.withIdentity(undefined, cb);
        }

        const { id, displayName, type, ...rest } = identity;
        const authenticatedIdentity = new AuthenticatedIdentity({
            id,
            displayName,
            type,
            ...rest
        });

        return this.identityContext.withIdentity(authenticatedIdentity, cb);
    }

    async getPermission<TPermission extends SecurityPermission = SecurityPermission>(
        permission: string
    ) {
        return this.identityContext.getPermission<TPermission>(permission);
    }

    async getPermissions<TPermission extends SecurityPermission = SecurityPermission>(
        permission: string
    ) {
        return this.identityContext.getPermissions<TPermission>(permission);
    }

    async listPermissions() {
        return this.identityContext.listPermissions();
    }

    async hasFullAccess(): Promise<boolean> {
        return this.identityContext.hasFullAccess();
    }

    // ========================================================================
    // Phase 1: Events (NEW IMPLEMENTATION)
    // ========================================================================

    get onBeforeLogin() {
        return this.oldSecurity.onBeforeLogin;
    }

    get onLogin() {
        return this.oldSecurity.onLogin;
    }

    get onAfterLogin() {
        return this.oldSecurity.onAfterLogin;
    }

    get onIdentity() {
        return this.oldSecurity.onIdentity;
    }

    // ========================================================================
    // Phase 2+: Forward to old implementation (TO BE REPLACED)
    // ========================================================================

    getStorageOperations() {
        return this.oldSecurity.getStorageOperations();
    }

    addAuthorizer(authorizer: any) {
        // @ts-expect-error This will go away after full refactor.
        this.container.registerFactory(Authorizer, () => {
            return {
                authorize(): Promise<Permissions[]> {
                    return authorizer();
                }
            };
        });
    }

    getAuthorizers() {
        return this.oldSecurity.getAuthorizers();
    }

    // API Keys - Phase 2 (forwarding for now)
    async getApiKey(id: string) {
        return this.oldSecurity.getApiKey.call(this, id);
    }

    async getApiKeyByToken(token: string) {
        return this.oldSecurity.getApiKeyByToken.call(this, token);
    }

    async listApiKeys() {
        return this.oldSecurity.listApiKeys.call(this);
    }

    async createApiKey(data: any) {
        return this.oldSecurity.createApiKey.call(this, data);
    }

    async updateApiKey(id: string, data: any) {
        return this.oldSecurity.updateApiKey.call(this, id, data);
    }

    async deleteApiKey(id: string) {
        return this.oldSecurity.deleteApiKey.call(this, id);
    }

    get onApiKeyBeforeCreate() {
        return this.oldSecurity.onApiKeyBeforeCreate;
    }

    get onApiKeyAfterCreate() {
        return this.oldSecurity.onApiKeyAfterCreate;
    }

    get onApiKeyBeforeUpdate() {
        return this.oldSecurity.onApiKeyBeforeUpdate;
    }

    get onApiKeyAfterUpdate() {
        return this.oldSecurity.onApiKeyAfterUpdate;
    }

    get onApiKeyBeforeDelete() {
        return this.oldSecurity.onApiKeyBeforeDelete;
    }

    get onApiKeyAfterDelete() {
        return this.oldSecurity.onApiKeyAfterDelete;
    }

    // Groups - Phase 3 (forwarding for now)
    async getGroup(params: any) {
        return this.oldSecurity.getGroup(params);
    }

    async listGroups(params?: any) {
        return this.oldSecurity.listGroups.call(this, params);
    }

    async createGroup(input: any) {
        return this.oldSecurity.createGroup(input);
    }

    async updateGroup(id: string, input: any) {
        return this.oldSecurity.updateGroup(id, input);
    }

    async deleteGroup(id: string) {
        return this.oldSecurity.deleteGroup(id);
    }

    get onGroupBeforeCreate() {
        return this.oldSecurity.onGroupBeforeCreate;
    }

    get onGroupAfterCreate() {
        return this.oldSecurity.onGroupAfterCreate;
    }

    get onGroupBeforeUpdate() {
        return this.oldSecurity.onGroupBeforeUpdate;
    }

    get onGroupAfterUpdate() {
        return this.oldSecurity.onGroupAfterUpdate;
    }

    get onGroupBeforeDelete() {
        return this.oldSecurity.onGroupBeforeDelete;
    }

    get onGroupAfterDelete() {
        return this.oldSecurity.onGroupAfterDelete;
    }

    // Teams - Phase 4 (forwarding for now)
    async getTeam(params: any) {
        return this.oldSecurity.getTeam(params);
    }

    async listTeams(params?: any) {
        return this.oldSecurity.listTeams(params);
    }

    async createTeam(input: any) {
        return this.oldSecurity.createTeam(input);
    }

    async updateTeam(id: string, input: any) {
        return this.oldSecurity.updateTeam(id, input);
    }

    async deleteTeam(id: string) {
        return this.oldSecurity.deleteTeam(id);
    }

    get onTeamBeforeCreate() {
        return this.oldSecurity.onTeamBeforeCreate;
    }

    get onTeamAfterCreate() {
        return this.oldSecurity.onTeamAfterCreate;
    }

    get onTeamBeforeUpdate() {
        return this.oldSecurity.onTeamBeforeUpdate;
    }

    get onTeamAfterUpdate() {
        return this.oldSecurity.onTeamAfterUpdate;
    }

    get onTeamBeforeDelete() {
        return this.oldSecurity.onTeamBeforeDelete;
    }

    get onTeamAfterDelete() {
        return this.oldSecurity.onTeamAfterDelete;
    }

    // Tenant Links - Phase 5 (forwarding for now)
    async createTenantLinks(params: any) {
        return this.oldSecurity.createTenantLinks(params);
    }

    async updateTenantLinks(params: any) {
        return this.oldSecurity.updateTenantLinks(params);
    }

    async deleteTenantLinks(params: any) {
        return this.oldSecurity.deleteTenantLinks(params);
    }

    async listTenantLinksByType<TLink extends TenantLink = TenantLink>(params: any) {
        return this.oldSecurity.listTenantLinksByType<TLink>(params);
    }

    async listTenantLinksByTenant(params: any) {
        return this.oldSecurity.listTenantLinksByTenant(params);
    }

    async listTenantLinksByIdentity(params: any) {
        return this.oldSecurity.listTenantLinksByIdentity(params);
    }

    async getTenantLinkByIdentity<TLink extends TenantLink = TenantLink>(params: any) {
        return this.oldSecurity.getTenantLinkByIdentity<TLink>(params);
    }
}
