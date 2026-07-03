import { Identity } from "~/features/security/IdentityContext/index.js";

export type { Jwk, Jwt } from "~/features/security/utils/verifyJwtUsingJwk.js";

export type SecurityIdentity = Identity;

export interface GetGroupWhere {
    id?: string;
    slug?: string;
    tenant?: string;
}

export interface GetTeamWhere {
    id?: string;
    slug?: string;
    tenant?: string;
}

export interface SecurityStorageOperations {
    getRole(params: StorageOperationsGetRoleParams): Promise<Role | null>;

    listRoles(params: StorageOperationsListRolesParams): Promise<Role[]>;

    createRole(params: StorageOperationsCreateRoleParams): Promise<void>;

    updateRole(params: StorageOperationsUpdateRoleParams): Promise<void>;

    deleteRole(params: StorageOperationsDeleteRoleParams): Promise<void>;

    getTeam(params: StorageOperationsGetTeamParams): Promise<Team | null>;

    listTeams(params: StorageOperationsListTeamsParams): Promise<Team[]>;

    createTeam(params: StorageOperationsCreateTeamParams): Promise<void>;

    updateTeam(params: StorageOperationsUpdateTeamParams): Promise<void>;

    deleteTeam(params: StorageOperationsDeleteTeamParams): Promise<void>;

    getApiKey(params: StorageOperationsGetApiKeyParams): Promise<StorageApiKey | null>;

    getApiKeyByToken(
        params: StorageOperationsGetApiKeyByTokenParams
    ): Promise<StorageApiKey | null>;

    getApiKeyBySlug(params: StorageOperationsGetApiKeyBySlugParams): Promise<StorageApiKey | null>;

    listApiKeys(params: StorageOperationsListApiKeysParams): Promise<StorageApiKey[]>;

    createApiKey(params: StorageOperationsCreateApiKeyParams): Promise<void>;

    updateApiKey(params: StorageOperationsUpdateApiKeyParams): Promise<void>;

    deleteApiKey(params: StorageOperationsDeleteApiKeyParams): Promise<void>;
}

export type SecurityPermission<T = Record<string, any>> = T & {
    name: string;
};

export interface FullAccessPermission {
    name: "*";
}

export interface CreatedBy {
    id: string;
    displayName: string | null;
    type: string;
}

export interface Role {
    // Roles defined via plugins don't have `createdOn` and `createdBy` specified.
    createdOn: string | null;
    createdBy: CreatedBy | null;

    id: string;
    name: string;
    slug: string;
    description: string;
    system: boolean;
    permissions: SecurityPermission[];

    // Set to `true` when a role is defined via a plugin.
    plugin?: boolean;
}

export type SecurityRole = Role;
export type SecurityTeam = Team;

export interface GetRoleParams {
    where: GetGroupWhere;
}

export interface ListRolesParams {
    where?: {
        id_in?: string[];
        slug_in?: string[];
    };
    sort?: string[];
}

export type StorageRole = Role & { tenant: string };

export interface CreateRoleParams {
    role: StorageRole;
}

export interface UpdateRoleParams {
    role: StorageRole;
}

export interface DeleteRoleParams {
    role: StorageRole;
}

export interface Team {
    // Teams defined via plugins don't have `createdOn` and `createdBy` specified.
    createdOn: string | null;
    createdBy: CreatedBy | null;

    id: string;
    name: string;
    slug: string;
    description: string;
    system: boolean;
    roles: string[];

    // Set to `true` when a role is defined via a plugin.
    plugin?: boolean;
}

export type TeamInput = Pick<Team, "name" | "slug" | "description" | "roles"> & {
    system?: boolean;
};

export interface GetTeamParams {
    where: GetTeamWhere;
}

export interface ListTeamsParams {
    where?: {
        id_in?: string[];
        slug_in?: string[];
    };
    sort?: string[];
}

export type StorageTeam = Team & { tenant: string };

export interface CreateTeamParams {
    team: StorageTeam;
}

export interface UpdateTeamParams {
    original: StorageTeam;
    team: StorageTeam;
}

export interface DeleteTeamParams {
    team: StorageTeam;
}

export interface ApiKey {
    id: string;
    name: string;
    slug: string;
    description: string;
    token: string;
    permissions: SecurityPermission[];
    createdBy: CreatedBy;
    createdOn: string;
}

export interface StorageApiKey {
    id: string;
    tenant: string;
    name: string;
    slug: string;
    description: string;
    token: string;
    permissions: SecurityPermission[];
    createdBy: CreatedBy;
    createdOn: string;
}

export interface ApiKeyPermission extends SecurityPermission {
    name: "security.apiKey";
}

export interface GetApiKeyParams {
    tenant: string;
    id: string;
}

export interface ListApiKeysParams {
    sort?: string[];
}

export interface GetApiKeyByTokenParams {
    tenant: string;
    token: string;
}

export interface GetApiKeyBySlugParams {
    tenant: string;
    slug: string;
}

export interface CreateApiKeyParams {
    apiKey: StorageApiKey;
}

export interface UpdateApiKeyParams {
    apiKey: StorageApiKey;
}

export interface DeleteApiKeyParams {
    apiKey: StorageApiKey;
}

export interface StorageOperationsListApiKeysParams extends ListApiKeysParams {
    where: {
        tenant: string;
    };
}

export interface StorageOperationsGetRoleParams extends GetRoleParams {
    where: GetRoleParams["where"] & {
        tenant: string;
    };
}

export interface StorageOperationsListRolesParams extends ListRolesParams {
    where: ListRolesParams["where"] & {
        tenant: string;
    };
}

export type StorageOperationsCreateRoleParams = CreateRoleParams;
export type StorageOperationsUpdateRoleParams = UpdateRoleParams;
export type StorageOperationsDeleteRoleParams = DeleteRoleParams;

export interface StorageOperationsGetTeamParams extends GetTeamParams {
    where: GetTeamParams["where"] & {
        tenant: string;
    };
}

export interface StorageOperationsListTeamsParams extends ListTeamsParams {
    where: ListTeamsParams["where"] & {
        tenant: string;
    };
}

export type StorageOperationsCreateTeamParams = CreateTeamParams;
export type StorageOperationsUpdateTeamParams = UpdateTeamParams;
export type StorageOperationsDeleteTeamParams = DeleteTeamParams;
export type StorageOperationsGetApiKeyParams = GetApiKeyParams;
export type StorageOperationsGetApiKeyByTokenParams = GetApiKeyByTokenParams;
export type StorageOperationsGetApiKeyBySlugParams = GetApiKeyBySlugParams;
export type StorageOperationsCreateApiKeyParams = CreateApiKeyParams;
export type StorageOperationsUpdateApiKeyParams = UpdateApiKeyParams;
export type StorageOperationsDeleteApiKeyParams = DeleteApiKeyParams;
