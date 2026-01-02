import type { TenancyContext } from "~/types/tenancy.js";
import type { LegacyContext } from "~/legacy/security/LegacyContext.js";
import { Identity } from "~/features/security/IdentityContext/index.js";

export type { Jwk, Jwt } from "~/features/security/utils/verifyJwtUsingJwk.js";

export type SecurityIdentity = Identity;

export type GetPermissions = <T extends SecurityPermission = SecurityPermission>(
    name: string
) => Promise<T[]>;

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

export type Security = LegacyContext;

export interface SecurityStorageOperations {
    getGroup(params: StorageOperationsGetGroupParams): Promise<Group | null>;

    listGroups(params: StorageOperationsListGroupsParams): Promise<Group[]>;

    createGroup(params: StorageOperationsCreateGroupParams): Promise<void>;

    updateGroup(params: StorageOperationsUpdateGroupParams): Promise<void>;

    deleteGroup(params: StorageOperationsDeleteGroupParams): Promise<void>;

    getTeam(params: StorageOperationsGetTeamParams): Promise<Team | null>;

    listTeams(params: StorageOperationsListTeamsParams): Promise<Team[]>;

    createTeam(params: StorageOperationsCreateTeamParams): Promise<void>;

    updateTeam(params: StorageOperationsUpdateTeamParams): Promise<void>;

    deleteTeam(params: StorageOperationsDeleteTeamParams): Promise<void>;

    getApiKey(params: StorageOperationsGetApiKeyParams): Promise<ApiKey | null>;

    getApiKeyByToken(params: StorageOperationsGetApiKeyByTokenParams): Promise<ApiKey | null>;

    listApiKeys(params: StorageOperationsListApiKeysParams): Promise<ApiKey[]>;

    createApiKey(params: StorageOperationsCreateApiKeyParams): Promise<void>;

    updateApiKey(params: StorageOperationsUpdateApiKeyParams): Promise<void>;

    deleteApiKey(params: StorageOperationsDeleteApiKeyParams): Promise<void>;
}

export type SecurityPermission<T = Record<string, any>> = T & {
    name: string;
};

export interface SecurityContext extends TenancyContext {
    security: Security;
}

export interface FullAccessPermission {
    name: "*";
}

export interface CreatedBy {
    id: string;
    displayName: string | null;
    type: string;
}

export interface Group {
    // Groups defined via plugins might not have `tenant` specified (meaning they are global).
    tenant: string | null;

    // Groups defined via plugins don't have `createdOn` and `createdBy` specified.
    createdOn: string | null;
    createdBy: CreatedBy | null;

    id: string;
    name: string;
    slug: string;
    description: string;
    system: boolean;
    permissions: SecurityPermission[];

    // Set to `true` when a group is defined via a plugin.
    plugin?: boolean;
}

export type SecurityRole = Group;
export type SecurityTeam = Team;

export interface GetGroupParams {
    where: GetGroupWhere;
}

export interface ListGroupsParams {
    where?: {
        id_in?: string[];
        slug_in?: string[];
    };
    sort?: string[];
}

export interface CreateGroupParams {
    group: Group;
}

export interface UpdateGroupParams {
    group: Group;
}

export interface DeleteGroupParams {
    group: Group;
}

export interface Team {
    // Teams defined via plugins might not have `tenant` specified (meaning they are global).
    tenant: string | null;

    // Teams defined via plugins don't have `createdOn` and `createdBy` specified.
    createdOn: string | null;
    createdBy: CreatedBy | null;

    id: string;
    name: string;
    slug: string;
    description: string;
    system: boolean;
    groups: string[];

    // Set to `true` when a group is defined via a plugin.
    plugin?: boolean;
}

export type TeamInput = Pick<Team, "name" | "slug" | "description" | "groups"> & {
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

export interface CreateTeamParams {
    team: Team;
}

export interface UpdateTeamParams {
    original: Team;
    team: Team;
}

export interface DeleteTeamParams {
    team: Team;
}

export interface TenantLink<TData = any> {
    createdOn: string;
    identity: string;
    tenant: string;
    type: string;
    data?: TData;
}

export interface PermissionsTenantLinkGroup {
    id: string;
    permissions: SecurityPermission[];
}

export interface PermissionsTenantLinkTeam {
    id: string;
    groups: Array<{ id: string; permissions: SecurityPermission[] }>;
}

export type PermissionsTenantLink = TenantLink<{
    groups: PermissionsTenantLinkGroup[];
    teams: PermissionsTenantLinkTeam[];
}>;

export interface ApiKey {
    id: string;
    tenant: string;
    name: string;
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

export interface CreateApiKeyParams {
    apiKey: ApiKey;
}

export interface UpdateApiKeyParams {
    apiKey: ApiKey;
}

export interface DeleteApiKeyParams {
    apiKey: ApiKey;
}

export interface StorageOperationsListApiKeysParams extends ListApiKeysParams {
    where: {
        tenant: string;
    };
}

export interface StorageOperationsGetGroupParams extends GetGroupParams {
    where: GetGroupParams["where"] & {
        tenant: string;
    };
}

export interface StorageOperationsListGroupsParams extends ListGroupsParams {
    where: ListGroupsParams["where"] & {
        tenant: string;
    };
}

export type StorageOperationsCreateGroupParams = CreateGroupParams;
export type StorageOperationsUpdateGroupParams = UpdateGroupParams;
export type StorageOperationsDeleteGroupParams = DeleteGroupParams;

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
export type StorageOperationsCreateApiKeyParams = CreateApiKeyParams;
export type StorageOperationsUpdateApiKeyParams = UpdateApiKeyParams;
export type StorageOperationsDeleteApiKeyParams = DeleteApiKeyParams;
