import { type Container } from "@webiny/di";
import type { SecurityIdentity, SecurityPermission } from "~/types/security.js";
import { AuthenticationContext } from "~/features/security/authentication/AuthenticationContext/index.js";
import { Authenticator } from "~/features/security/authentication/Authenticator/index.js";
import { Authorizer } from "~/features/security/authorization/Authorizer/abstractions.js";
import {
    AuthenticatedIdentity,
    IdentityContext,
    IdentityData
} from "~/features/security/IdentityContext/index.js";
import { GetRoleUseCase } from "~/features/security/roles/GetRole/index.js";
import { ListRolesUseCase } from "~/features/security/roles/ListRoles/index.js";
import { CreateRoleUseCase } from "~/features/security/roles/CreateRole/index.js";
import { UpdateRole } from "~/features/security/roles/UpdateRole/index.js";
import { DeleteRoleUseCase } from "~/features/security/roles/DeleteRole/index.js";
import { GetTeam } from "~/features/security/teams/GetTeam/index.js";
import { ListTeamsUseCase } from "~/features/security/teams/ListTeams/index.js";
import { CreateTeam } from "~/features/security/teams/CreateTeam/index.js";
import { UpdateTeam } from "~/features/security/teams/UpdateTeam/index.js";
import { DeleteTeam } from "~/features/security/teams/DeleteTeam/index.js";

/**
 * Legacy bridge that implements the old Security interface.
 * As we implement each phase, we'll replace forwarding with delegation.
 */
export class LegacyContext {
    constructor(private container: Container) {}

    private get identityContext() {
        return this.container.resolve(IdentityContext);
    }

    private get authenticationContext() {
        return this.container.resolve(AuthenticationContext);
    }

    addAuthenticator(authenticator: Authenticator.Interface["authenticate"]): void {
        this.container.registerFactory(Authenticator, () => {
            return {
                authenticate(token: string): Promise<IdentityData | null> {
                    return authenticator(token);
                }
            };
        });
    }

    async authenticate(token: string): Promise<void> {
        // Authenticate using new context
        const identity = await this.authenticationContext.authenticate(token);

        // Set identity in IdentityContext
        this.identityContext.setIdentity(identity);
    }

    getIdentity(): SecurityIdentity {
        const identity = this.identityContext.getIdentity();

        // Convert our Identity class to old SecurityIdentity format
        if (identity.isAnonymous()) {
            return undefined as any;
        }

        return identity;
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

    async getRole(params: any) {
        const useCase = this.container.resolve(GetRoleUseCase);
        const result = await useCase.execute(params.where);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    async listRoles(params?: any) {
        const useCase = this.container.resolve(ListRolesUseCase);
        const result = await useCase.execute(params);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    async createRole(input: any) {
        const useCase = this.container.resolve(CreateRoleUseCase);
        const result = await useCase.execute(input);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    async updateRole(id: string, input: any) {
        const useCase = this.container.resolve(UpdateRole);
        const result = await useCase.execute(id, input);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    async deleteRole(id: string) {
        const useCase = this.container.resolve(DeleteRoleUseCase);
        const result = await useCase.execute(id);

        if (result.isFail()) {
            throw result.error;
        }
    }

    addAuthorizer(authorizer: any) {
        // @ts-expect-error
        this.container.registerFactory(Authorizer, () => {
            return {
                authorize(): Promise<Permissions[]> {
                    return authorizer();
                }
            };
        });
    }

    async getTeam(params: any) {
        const useCase = this.container.resolve(GetTeam);
        const result = await useCase.execute(params.where);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    async listTeams(params?: any) {
        const useCase = this.container.resolve(ListTeamsUseCase);
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
}
