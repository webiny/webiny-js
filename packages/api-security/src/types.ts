import { Plugin } from "@webiny/plugins/types";
import { Context } from "@webiny/handler/types";
import { Authentication, Identity } from "@webiny/api-authentication/types";
import { Topic } from "@webiny/pubsub/types";
import { GetTenant } from "~/createSecurity";
import { ProjectPackageFeatures } from "@webiny/wcp/types";
import { TenancyContext } from "@webiny/api-tenancy/types";

// Backwards compatibility - START
export type SecurityIdentity = Identity;

export type SecurityAuthenticationPlugin = Plugin & {
    type: "security-authentication";
    authenticate(context: Context): Promise<null> | Promise<SecurityIdentity>;
};

export interface SecurityAuthorizationPlugin extends Plugin {
    type: "security-authorization";

    getPermissions(context: SecurityContext): Promise<SecurityPermission[]>;
}

// Backwards compatibility - END

export type GetPermissions = <T extends SecurityPermission = SecurityPermission>(
    name: string
) => Promise<T[]>;

export interface Authorizer {
    (): Promise<SecurityPermission[] | null>;
}

export interface SecurityConfig {
    advancedAccessControlLayer?: ProjectPackageFeatures["advancedAccessControlLayer"];
    getTenant: GetTenant;
    storageOperations: SecurityStorageOperations;
}

export interface ErrorEvent extends InstallEvent {
    error: Error;
}

export interface InstallEvent {
    tenant: string;
}

export interface LoginEvent<TIdentity> {
    identity: TIdentity;
}

export interface IdentityEvent<TIdentity> {
    identity: TIdentity;
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

export interface Security<TIdentity = SecurityIdentity> extends Authentication<TIdentity> {
    /**
     * @deprecated
     */
    onBeforeInstall: Topic<InstallEvent>;
    onSystemBeforeInstall: Topic<InstallEvent>;
    onInstall: Topic<InstallEvent>;
    /**
     * @deprecated
     */
    onAfterInstall: Topic<InstallEvent>;
    onSystemAfterInstall: Topic<InstallEvent>;
    onCleanup: Topic<ErrorEvent>;
    onBeforeLogin: Topic<LoginEvent<TIdentity>>;
    onLogin: Topic<LoginEvent<TIdentity>>;
    onAfterLogin: Topic<LoginEvent<TIdentity>>;
    onIdentity: Topic<IdentityEvent<TIdentity>>;

    config: SecurityConfig;

    getStorageOperations(): SecurityStorageOperations;

    isAuthorizationEnabled(): boolean;

    withoutAuthorization<T = any>(cb: () => Promise<T>): Promise<T>;

    /**
     * Replace in favor of withoutAuthorization.
     *
     * If really required, should be used carefully.
     * @deprecated
     */
    enableAuthorization(): void;

    /**
     * Replace in favor of withoutAuthorization.
     *
     * If really required, should be used carefully.
     * @deprecated
     */
    disableAuthorization(): void;

    addAuthorizer(authorizer: Authorizer): void;

    getAuthorizers(): Authorizer[];

    // getPermission: GetPermission;
    // getPermissions(): Promise<SecurityPermission[]>;

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

    onApiKeyBeforeCreate: Topic<{ apiKey: ApiKey }>;
    onApiKeyAfterCreate: Topic<{ apiKey: ApiKey }>;
    onApiKeyBeforeUpdate: Topic<{ original: ApiKey; apiKey: ApiKey }>;
    onApiKeyAfterUpdate: Topic<{ original: ApiKey; apiKey: ApiKey }>;
    onApiKeyBeforeDelete: Topic<{ apiKey: ApiKey }>;
    onApiKeyAfterDelete: Topic<{ apiKey: ApiKey }>;

    // Groups
    getGroup(params: GetGroupParams): Promise<Group>;

    listGroups(params?: ListGroupsParams): Promise<Group[]>;

    createGroup(input: GroupInput): Promise<Group>;

    updateGroup(id: string, input: Partial<GroupInput>): Promise<Group>;

    deleteGroup(id: string): Promise<void>;

    onGroupBeforeCreate: Topic<{ group: Group }>;
    onGroupAfterCreate: Topic<{ group: Group }>;
    onGroupBeforeUpdate: Topic<{ original: Group; group: Group }>;
    onGroupAfterUpdate: Topic<{ original: Group; group: Group }>;
    onGroupBeforeDelete: Topic<{ group: Group }>;
    onGroupAfterDelete: Topic<{ group: Group }>;

    // Teams
    getTeam(params: GetTeamParams): Promise<Team>;

    listTeams(params?: ListTeamsParams): Promise<Team[]>;

    createTeam(input: TeamInput): Promise<Team>;

    updateTeam(id: string, input: Partial<TeamInput>): Promise<Team>;

    deleteTeam(id: string): Promise<void>;

    onTeamBeforeCreate: Topic<{ team: Team }>;
    onTeamAfterCreate: Topic<{ team: Team }>;
    onTeamBeforeUpdate: Topic<{ original: Team; team: Team }>;
    onTeamAfterUpdate: Topic<{ original: Team; team: Team }>;
    onTeamBeforeDelete: Topic<{ team: Team }>;
    onTeamAfterDelete: Topic<{ team: Team }>;

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

    // System
    getVersion(): Promise<string | null>;

    setVersion(version: string): Promise<System>;

    install(this: Security): Promise<void>;
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

    getSystemData(params: StorageOperationsGetSystemParams): Promise<System | null>;

    createSystemData(params: StorageOperationsCreateSystemParams): Promise<System>;

    updateSystemData(params: StorageOperationsUpdateSystemParams): Promise<System>;

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

    getApiKey(params: StorageOperationsGetApiKeyParams): Promise<ApiKey>;

    getApiKeyByToken(params: StorageOperationsGetApiKeyByTokenParams): Promise<ApiKey | null>;

    listApiKeys(params: StorageOperationsListApiKeysParams): Promise<ApiKey[]>;

    createApiKey(params: StorageOperationsCreateApiKeyParams): Promise<ApiKey>;

    updateApiKey(params: StorageOperationsUpdateApiKeyParams): Promise<ApiKey>;

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
    tenant: string;
    createdOn: string;
    createdBy: CreatedBy | null;
    id: string;
    name: string;
    slug: string;
    description: string;
    system: boolean;
    permissions: SecurityPermission[];
    webinyVersion: string;
}

export type GroupInput = Pick<Group, "name" | "slug" | "description" | "permissions"> & {
    system?: boolean;
};

export interface GetGroupParams {
    where: GetGroupWhere;
}

export interface ListGroupsParams {
    where?: {
        id_in?: string[];
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
    original: Group;
    group: Group;
}

export interface DeleteGroupParams {
    group: Group;
}

export interface Team {
    tenant: string;
    createdOn: string;
    createdBy: CreatedBy | null;
    id: string;
    name: string;
    slug: string;
    description: string;
    system: boolean;
    groups: string[];
    webinyVersion: string;
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

export interface System {
    tenant: string;
    version: string;
    installedOn: string;
}

export interface GetSystemParams {
    tenant: string;
}

export interface CreateSystemParams {
    system: System;
}

export interface UpdateSystemParams {
    original: System;
    system: System;
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

export type PermissionsTenantLink = TenantLink<{
    groups: Array<{ id: string; permissions: SecurityPermission[] }>;
    teams: Array<{ id: string; groups: Array<{ id: string; permissions: SecurityPermission[] }> }>;
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
    original: ApiKey;
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

export type StorageOperationsGetSystemParams = GetSystemParams;
export type StorageOperationsCreateSystemParams = CreateSystemParams;
export type StorageOperationsUpdateSystemParams = UpdateSystemParams;

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
