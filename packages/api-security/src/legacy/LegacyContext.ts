import type { Container } from "@webiny/di-container";
import type { Security, SecurityIdentity, SecurityPermission, TenantLink } from "~/types.js";
import {
    AuthenticationContext,
    Authenticator as AuthenticatorAbstraction
} from "~/features/authentication/index.js";
import { Authorizer } from "../features/authorization/shared/abstractions.js";
import { AuthenticatedIdentity, IdentityContext } from "~/features/IdentityContext/index.js";
import type { Authenticator } from "@webiny/api-authentication/types.js";
import { GetApiKey } from "~/features/apiKeys/GetApiKey/index.js";
import { GetApiKeyByToken } from "~/features/apiKeys/GetApiKeyByToken/index.js";
import { ListApiKeys } from "~/features/apiKeys/ListApiKeys/index.js";
import { CreateApiKey } from "~/features/apiKeys/CreateApiKey/index.js";
import { UpdateApiKey } from "~/features/apiKeys/UpdateApiKey/index.js";
import { DeleteApiKey } from "~/features/apiKeys/DeleteApiKey/index.js";
import { GetGroup } from "~/features/groups/GetGroup/index.js";
import { ListGroupsUseCase } from "~/features/groups/ListGroups/index.js";
import { CreateGroupUseCase } from "~/features/groups/CreateGroup/index.js";
import { UpdateGroup } from "~/features/groups/UpdateGroup/index.js";
import { DeleteGroupUseCase } from "~/features/groups/DeleteGroup/index.js";
import { GetTeam } from "~/features/teams/GetTeam/index.js";
import { ListTeams } from "~/features/teams/ListTeams/index.js";
import { CreateTeam } from "~/features/teams/CreateTeam/index.js";
import { UpdateTeam } from "~/features/teams/UpdateTeam/index.js";
import { DeleteTeam } from "~/features/teams/DeleteTeam/index.js";
import { CreateTenantLinks } from "~/features/tenantLinks/CreateTenantLinks/index.js";
import { UpdateTenantLinks } from "~/features/tenantLinks/UpdateTenantLinks/index.js";
import { DeleteTenantLinks } from "~/features/tenantLinks/DeleteTenantLinks/index.js";
import { ListTenantLinksByType } from "~/features/tenantLinks/ListTenantLinksByType/index.js";
import { ListTenantLinksByTenant } from "~/features/tenantLinks/ListTenantLinksByTenant/index.js";
import { ListTenantLinksByIdentity } from "~/features/tenantLinks/ListTenantLinksByIdentity/index.js";
import { GetTenantLinkByIdentity } from "~/features/tenantLinks/GetTenantLinkByIdentity/index.js";

/**
 * Legacy bridge that implements the old Security interface.
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

    // ===== LEGACY ===== //
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

    // ===== LEGACY ===== //
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
    // Phase 2: API Keys (NEW IMPLEMENTATION)
    // ========================================================================

    async getApiKey(id: string) {
        const useCase = this.container.resolve(GetApiKey);
        const result = await useCase.execute(id);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    async getApiKeyByToken(token: string) {
        const useCase = this.container.resolve(GetApiKeyByToken);
        const result = await useCase.execute(token);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    async listApiKeys(params?: any) {
        const useCase = this.container.resolve(ListApiKeys);
        const result = await useCase.execute(params);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    async createApiKey(data: any) {
        const useCase = this.container.resolve(CreateApiKey);
        const result = await useCase.execute(data);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    async updateApiKey(id: string, data: any) {
        const useCase = this.container.resolve(UpdateApiKey);
        const result = await useCase.execute(id, data);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    async deleteApiKey(id: string) {
        const useCase = this.container.resolve(DeleteApiKey);
        const result = await useCase.execute(id);

        if (result.isFail()) {
            throw result.error;
        }
        return true;
    }

    // ========================================================================
    // Phase 3: Groups (NEW IMPLEMENTATION)
    // ========================================================================

    async getGroup(params: any) {
        const useCase = this.container.resolve(GetGroup);
        const result = await useCase.execute(params.where);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    async listGroups(params?: any) {
        const useCase = this.container.resolve(ListGroupsUseCase);
        const result = await useCase.execute(params);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    async createGroup(input: any) {
        const useCase = this.container.resolve(CreateGroupUseCase);
        const result = await useCase.execute(input);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    async updateGroup(id: string, input: any) {
        const useCase = this.container.resolve(UpdateGroup);
        const result = await useCase.execute(id, input);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    async deleteGroup(id: string) {
        const useCase = this.container.resolve(DeleteGroupUseCase);
        const result = await useCase.execute(id);

        if (result.isFail()) {
            throw result.error;
        }
    }

    // ========================================================================
    // Phase 4+: Forward to old implementation (TO BE REPLACED)
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

    // ========================================================================
    // Phase 4: Teams (NEW IMPLEMENTATION)
    // ========================================================================

    async getTeam(params: any) {
        const useCase = this.container.resolve(GetTeam);
        const result = await useCase.execute(params.where);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    async listTeams(params?: any) {
        const useCase = this.container.resolve(ListTeams);
        const result = await useCase.execute(params);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    async createTeam(input: any) {
        const useCase = this.container.resolve(CreateTeam);
        const result = await useCase.execute(input);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    async updateTeam(id: string, input: any) {
        const useCase = this.container.resolve(UpdateTeam);
        const result = await useCase.execute(id, input);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    async deleteTeam(id: string) {
        const useCase = this.container.resolve(DeleteTeam);
        const result = await useCase.execute(id);

        if (result.isFail()) {
            throw result.error;
        }
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

    // ========================================================================
    // Phase 5: Tenant Links (NEW IMPLEMENTATION)
    // ========================================================================

    async createTenantLinks(params: any[]) {
        const useCase = this.container.resolve(CreateTenantLinks);
        const result = await useCase.execute(params);

        if (result.isFail()) {
            throw result.error;
        }
    }

    async updateTenantLinks(params: any[]) {
        const useCase = this.container.resolve(UpdateTenantLinks);
        const result = await useCase.execute(params);

        if (result.isFail()) {
            throw result.error;
        }
    }

    async deleteTenantLinks(params: any[]) {
        const useCase = this.container.resolve(DeleteTenantLinks);
        const result = await useCase.execute(params);

        if (result.isFail()) {
            throw result.error;
        }
    }

    async listTenantLinksByType<TLink extends TenantLink = TenantLink>(params: any) {
        const useCase = this.container.resolve(ListTenantLinksByType);
        const result = await useCase.execute<TLink>(params);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    async listTenantLinksByTenant(params: any) {
        const useCase = this.container.resolve(ListTenantLinksByTenant);
        const result = await useCase.execute(params);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    async listTenantLinksByIdentity(params: any) {
        const useCase = this.container.resolve(ListTenantLinksByIdentity);
        const result = await useCase.execute(params);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    async getTenantLinkByIdentity<TLink extends TenantLink = TenantLink>(params: any) {
        const useCase = this.container.resolve(GetTenantLinkByIdentity);
        const result = await useCase.execute<TLink>(params);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }
}
