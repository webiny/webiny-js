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

export interface GetGroupWhere {
    id?: string;
    slug?: string;
}

export interface Security<TIdentity = SecurityIdentity> extends Authentication<TIdentity> {
    onBeforeInstall: Topic;
    onInstall: Topic;
    onAfterInstall: Topic;
    onCleanup: Topic<ErrorEvent>;
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
    getGroup(where: GetGroupWhere, options?: CrudOptions): Promise<Group>;
    listGroups(options?: CrudOptions): Promise<Group[]>;
    createGroup(input: GroupInput, options?: CrudOptions): Promise<Group>;
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
    getTenantLinkByIdentity<TLink = TenantLink>(
        params: GetTenantLinkByIdentityParams
    ): Promise<TLink>;
    // System
    getVersion(): Promise<string>;
    setVersion(version: string): Promise<System>;
    isInstalled(): Promise<boolean>;
    install(this: Security): Promise<void>;
}

export interface SecurityStorageOperations {
    getGroup(params: GetGroupParams): Promise<Group>;
    listGroups(params: ListGroupsParams): Promise<Group[]>;
    createGroup(params: CreateGroupParams): Promise<Group>;
    updateGroup(params: UpdateGroupParams): Promise<Group>;
    deleteGroup(params: DeleteGroupParams): Promise<void>;
    getSystemData(params: GetSystemParams): Promise<System>;
    createSystemData(params: CreateSystemParams): Promise<System>;
    updateSystemData(params: UpdateSystemParams): Promise<System>;
    createTenantLinks(params: CreateTenantLinkParams[]): Promise<void>;
    updateTenantLinks(params: UpdateTenantLinkParams[]): Promise<void>;
    deleteTenantLinks(params: DeleteTenantLinkParams[]): Promise<void>;
    listTenantLinksByType<TLink = TenantLink>(
        params: ListTenantLinksByTypeParams
    ): Promise<TLink[]>;
    listTenantLinksByTenant(params: ListTenantLinksParams): Promise<TenantLink[]>;
    listTenantLinksByIdentity(params: ListTenantLinksByIdentityParams): Promise<TenantLink[]>;
    getTenantLinkByIdentity<TLink = TenantLink>(
        params: GetTenantLinkByIdentityParams
    ): Promise<TLink>;
    getApiKey(params: GetApiKeyParams): Promise<ApiKey>;
    getApiKeyByToken(params: GetApiKeyByTokenParams): Promise<ApiKey>;
    listApiKeys(params: ListApiKeysParams): Promise<ApiKey[]>;
    createApiKey(params: CreateApiKeyParams): Promise<ApiKey>;
    updateApiKey(params: UpdateApiKeyParams): Promise<ApiKey>;
    deleteApiKey(params: DeleteApiKeyParams): Promise<void>;
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
    tenant: string;
    where: GetGroupWhere;
}

export interface ListGroupsParams {
    tenant: string;
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

export interface CrudOptions {
    auth?: boolean;
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

export interface TenantLink<TData = Record<string, any>> {
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

export interface GetApiKeyByTokenParams {
    tenant: string;
    token: string;
}

export interface ListApiKeysParams {
    tenant: string;
    sort?: string[];
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
