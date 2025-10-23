import type { Authentication, Identity } from "@webiny/api-authentication/types.js";
import type { TenancyContext } from "@webiny/api-tenancy/types.js";

export type { Jwk, Jwt } from "./utils/verifyJwtUsingJwk.js";

export type SecurityIdentity = Identity;

export type GetPermissions = <T extends SecurityPermission = SecurityPermission>(
    name: string
) => Promise<T[]>;

export interface Authorizer {
    (): Promise<SecurityPermission[] | null>;
}

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

export type AuthenticationToken = string;

export interface Security<TIdentity = SecurityIdentity> extends Authentication<TIdentity> {
    /**
     * Returns the token which was used to authenticate (if authentication was successful).
     */
    getToken(): AuthenticationToken | undefined;

    isAuthorizationEnabled(): boolean;

    withoutAuthorization<T = any>(cb: () => Promise<T>): Promise<T>;

    withIdentity<T = any>(identity: Identity | undefined, cb: () => Promise<T>): Promise<T>;

    addAuthorizer(authorizer: Authorizer): void;

    getAuthorizers(): Authorizer[];

    getPermission<TPermission extends SecurityPermission = SecurityPermission>(
        permission: string
    ): Promise<TPermission | null>;

    getPermissions<TPermission extends SecurityPermission = SecurityPermission>(
        permission: string
    ): Promise<TPermission[]>;

    listPermissions(): Promise<SecurityPermission[]>;

    hasFullAccess(): Promise<boolean>;

    // API Keys
    getApiKey(id: string): Promise<ApiKey | null>;

    getApiKeyByToken(token: string): Promise<ApiKey | null>;

    listApiKeys(): Promise<ApiKey[]>;

    createApiKey(data: ApiKeyInput): Promise<ApiKey>;

    updateApiKey(id: string, data: ApiKeyInput): Promise<ApiKey>;

    deleteApiKey(id: string): Promise<boolean>;

    // Groups
    getGroup(params: GetGroupParams): Promise<Group>;

    listGroups(params?: ListGroupsParams): Promise<Group[]>;

    createGroup(input: GroupInput): Promise<Group>;

    updateGroup(id: string, input: Partial<GroupInput>): Promise<Group>;

    deleteGroup(id: string): Promise<void>;

    // Teams
    getTeam(params: GetTeamParams): Promise<Team>;

    listTeams(params?: ListTeamsParams): Promise<Team[]>;

    createTeam(input: TeamInput): Promise<Team>;

    updateTeam(id: string, input: Partial<TeamInput>): Promise<Team>;

    deleteTeam(id: string): Promise<void>;

    // Links
    createTenantLinks(params: CreateTenantLinkParams[]): Promise<void>;

    updateTenantLinks(params: UpdateTenantLinkParams[]): Promise<void>;

    deleteTenantLinks(params: DeleteTenantLinkParams[]): Promise<void>;

    listTenantLinksByType<TLink extends TenantLink = TenantLink>(
        params: ListTenantLinksByTypeParams
    ): Promise<TLink[]>;

    listTenantLinksByTenant(params: ListTenantLinksParams): Promise<TenantLink[]>;

    listTenantLinksByIdentity(params: ListTenantLinksByIdentityParams): Promise<TenantLink[]>;

    getTenantLinkByIdentity<TLink extends TenantLink = TenantLink>(
        params: GetTenantLinkByIdentityParams
    ): Promise<TLink | null>;
}

export interface SecurityStorageOperations {
    getGroup(params: StorageOperationsGetGroupParams): Promise<Group | null>;

    listGroups(params: StorageOperationsListGroupsParams): Promise<Group[]>;

    createGroup(params: StorageOperationsCreateGroupParams): Promise<Group>;

    updateGroup(params: StorageOperationsUpdateGroupParams): Promise<Group>;

    deleteGroup(params: StorageOperationsDeleteGroupParams): Promise<void>;

    getTeam(params: StorageOperationsGetTeamParams): Promise<Team | null>;

    listTeams(params: StorageOperationsListTeamsParams): Promise<Team[]>;

    createTeam(params: StorageOperationsCreateTeamParams): Promise<Team>;

    updateTeam(params: StorageOperationsUpdateTeamParams): Promise<Team>;

    deleteTeam(params: StorageOperationsDeleteTeamParams): Promise<void>;

    createTenantLinks(params: StorageOperationsCreateTenantLinkParams[]): Promise<void>;

    updateTenantLinks(params: StorageOperationsUpdateTenantLinkParams[]): Promise<void>;

    deleteTenantLinks(params: StorageOperationsDeleteTenantLinkParams[]): Promise<void>;

    listTenantLinksByType<TLink extends TenantLink = TenantLink>(
        params: ListTenantLinksByTypeParams
    ): Promise<TLink[]>;

    listTenantLinksByTenant(params: StorageOperationsListTenantLinksParams): Promise<TenantLink[]>;

    listTenantLinksByIdentity(
        params: StorageOperationsListTenantLinksByIdentityParams
    ): Promise<TenantLink[]>;

    getTenantLinkByIdentity<TLink extends TenantLink = TenantLink>(
        params: StorageOperationsGetTenantLinkByIdentityParams
    ): Promise<TLink | null>;

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

export interface SecurityContext<TIdentity = SecurityIdentity> extends TenancyContext {
    security: Security<TIdentity>;
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

    // Groups defined via plugins don't have `webinyVersion` specified.
    webinyVersion: string | null;

    // Set to `true` when a group is defined via a plugin.
    plugin?: boolean;
}

export type SecurityRole = Group;
export type SecurityTeam = Team;

export type GroupInput = Pick<Group, "name" | "slug" | "description" | "permissions"> & {
    system?: boolean;
};

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

export interface GroupsCreateParams {
    group: Group;
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

    // Teams defined via plugins don't have `webinyVersion` specified.
    webinyVersion: string | null;

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

export interface TeamsCreateParams {
    team: Team;
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

export interface CreateTenantLinkParams<TData = Record<string, any>> {
    identity: string;
    tenant: string;
    type: string;
    data?: TData;
}

export interface UpdateTenantLinkParams<TData = Record<string, any>> {
    identity: string;
    tenant: string;
    type: string;
    data?: TData;
}

export interface DeleteTenantLinkParams {
    identity: string;
    tenant: string;
}

export interface ListTenantLinksByTypeParams {
    tenant: string;
    type: string;
}

export interface ListTenantLinksByIdentityParams {
    identity: string;
}

export interface ListTenantLinksParams {
    tenant: string;
}

export interface GetTenantLinkByIdentityParams {
    identity: string;
    tenant: string;
}

export interface TenantLink<TData = any> {
    createdOn: string;
    identity: string;
    tenant: string;
    type: string;
    data?: TData;
    webinyVersion: string;
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
    webinyVersion?: string;
}

export interface ApiKeyInput {
    name: string;
    description: string;
    permissions: SecurityPermission[];
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

export interface StorageOperationsCreateTenantLinkParams extends CreateTenantLinkParams {
    createdOn: string;
    webinyVersion: string;
}

export type StorageOperationsUpdateTenantLinkParams = UpdateTenantLinkParams;
export type StorageOperationsDeleteTenantLinkParams = DeleteTenantLinkParams;
export type StorageOperationsListTenantLinksParams = ListTenantLinksParams;
export type StorageOperationsListTenantLinksByIdentityParams = ListTenantLinksByIdentityParams;
export type StorageOperationsGetTenantLinkByIdentityParams = GetTenantLinkByIdentityParams;
export type StorageOperationsGetApiKeyParams = GetApiKeyParams;
export type StorageOperationsGetApiKeyByTokenParams = GetApiKeyByTokenParams;
export type StorageOperationsCreateApiKeyParams = CreateApiKeyParams;
export type StorageOperationsUpdateApiKeyParams = UpdateApiKeyParams;
export type StorageOperationsDeleteApiKeyParams = DeleteApiKeyParams;
