import { Plugin } from "@webiny/plugins/types";
import { ContextInterface } from "@webiny/handler/types";
import { Authentication, Identity } from "@webiny/api-authentication/types";
import { Topic } from "@webiny/pubsub/types";
import { GetTenant } from "~/createSecurity";

// Backwards compatibility - START
export type SecurityIdentity = Identity;

export type SecurityAuthenticationPlugin = Plugin & {
    type: "security-authentication";
    authenticate(context: ContextInterface): Promise<null> | Promise<SecurityIdentity>;
};

export interface SecurityAuthorizationPlugin extends Plugin {
    type: "security-authorization";
    getPermissions(context: SecurityContext): Promise<SecurityPermission[]>;
}
// Backwards compatibility - END

export interface Authorizer {
    (): Promise<SecurityPermission[]>;
}

export interface SecurityConfig {
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
}

export interface Security<TIdentity = SecurityIdentity> extends Authentication<TIdentity> {
    onBeforeInstall: Topic<InstallEvent>;
    onInstall: Topic<InstallEvent>;
    onAfterInstall: Topic<InstallEvent>;
    onCleanup: Topic<ErrorEvent>;
    onBeforeLogin: Topic<LoginEvent<TIdentity>>;
    onLogin: Topic<LoginEvent<TIdentity>>;
    onAfterLogin: Topic<LoginEvent<TIdentity>>;
    onIdentity: Topic<IdentityEvent<TIdentity>>;
    getStorageOperations(): SecurityStorageOperations;
    enableAuthorization(): void;
    disableAuthorization(): void;
    addAuthorizer(authorizer: Authorizer): void;
    getAuthorizers(): Authorizer[];
    getPermission<TPermission extends SecurityPermission = SecurityPermission>(
        permission: string
    ): Promise<TPermission | null>;
    getPermissions(): Promise<SecurityPermission[]>;
    hasFullAccess(): Promise<boolean>;
    // API Keys
    getApiKey(id: string): Promise<ApiKey>;
    getApiKeyByToken(token: string): Promise<ApiKey>;
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
    ): Promise<TLink>;
    // System
    getVersion(): Promise<string>;
    setVersion(version: string): Promise<System>;
    install(this: Security): Promise<void>;
}

export interface SecurityStorageOperations {
    getGroup(params: StorageOperationsGetGroupParams): Promise<Group>;
    listGroups(params: StorageOperationsListGroupsParams): Promise<Group[]>;
    createGroup(params: StorageOperationsCreateGroupParams): Promise<Group>;
    updateGroup(params: StorageOperationsUpdateGroupParams): Promise<Group>;
    deleteGroup(params: StorageOperationsDeleteGroupParams): Promise<void>;
    getSystemData(params: StorageOperationsGetSystemParams): Promise<System>;
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
    ): Promise<TLink>;
    getApiKey(params: StorageOperationsGetApiKeyParams): Promise<ApiKey>;
    getApiKeyByToken(params: StorageOperationsGetApiKeyByTokenParams): Promise<ApiKey>;
    listApiKeys(params: StorageOperationsListApiKeysParams): Promise<ApiKey[]>;
    createApiKey(params: StorageOperationsCreateApiKeyParams): Promise<ApiKey>;
    updateApiKey(params: StorageOperationsUpdateApiKeyParams): Promise<ApiKey>;
    deleteApiKey(params: StorageOperationsDeleteApiKeyParams): Promise<void>;
}

export interface SecurityPermission {
    name: string;
    [key: string]: any;
}

export interface SecurityContext<TIdentity = SecurityIdentity> extends ContextInterface {
    security: Security<TIdentity>;
}

export interface FullAccessPermission {
    name: "*";
}

export interface CreatedBy {
    id: string;
    displayName: string;
    type: string;
}

export interface Group {
    tenant: string;
    createdOn: string;
    createdBy: CreatedBy;
    id: string;
    name: string;
    slug: string;
    description: string;
    system: boolean;
    permissions: SecurityPermission[];
}

export type GroupInput = Pick<Group, "name" | "slug" | "description" | "permissions" | "system">;

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

export interface System {
    tenant: string;
    version: string;
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

export interface DeleteTenantLinkParams<TData = Record<string, any>> {
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
}

export type GroupTenantLink = TenantLink<{ group: string; permissions: SecurityPermission[] }>;

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
export type StorageOperationsGetSystemParams = GetSystemParams;
export type StorageOperationsCreateSystemParams = CreateSystemParams;
export type StorageOperationsUpdateSystemParams = UpdateSystemParams;
export interface StorageOperationsCreateTenantLinkParams extends CreateTenantLinkParams {
    createdOn: string;
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
