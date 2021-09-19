import { Plugin, PluginsContainer } from "@webiny/plugins/types";
import { ContextInterface } from "@webiny/handler/types";
import { Security } from "./Security";

export type SecurityIdentity = {
    id: string;
    displayName: string;
    type: string;
    [key: string]: any;
};

export type SecurityAuthenticationPlugin = Plugin & {
    type: "security-authentication";
    authenticate(context: ContextInterface): Promise<null> | Promise<SecurityIdentity>;
};

export interface SecurityPermission {
    name: string;
    [key: string]: any;
}

export interface SecurityAuthorizationPlugin extends Plugin {
    type: "security-authorization";
    getPermissions(context: SecurityContext): Promise<SecurityPermission[]>;
}

export interface SecurityContext extends ContextInterface {
    security: Security;
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
    name: string;
    slug: string;
    description: string;
    system: boolean;
    permissions: SecurityPermission[];
}

export type GroupInput = Pick<Group, "name" | "slug" | "description" | "system" | "permissions">;

export interface GroupsStorageOperationsGetParams {
    slug: string;
}

export interface GroupsStorageOperationsListParams {
    sort?: string[];
}

export interface GroupsStorageOperationsCreateParams {
    group: Group;
}

export interface GroupsStorageOperationsCreateParams {
    group: Group;
}

export interface GroupsStorageOperationsUpdateParams {
    original: Group;
    group: Group;
}

export interface GroupsStorageOperationsDeleteParams {
    group: Group;
}

interface GroupStorageOperationsFactoryParams {
    plugins: PluginsContainer;
    tenant: string;
}

export interface GroupsStorageOperationsFactory {
    (params: GroupStorageOperationsFactoryParams): GroupsStorageOperations;
}

export interface GroupsStorageOperations {
    get: (tenant: string, params: GroupsStorageOperationsGetParams) => Promise<Group>;
    list: (tenant: string, params: GroupsStorageOperationsListParams) => Promise<Group[]>;
    create: (tenant: string, params: GroupsStorageOperationsCreateParams) => Promise<Group>;
    update: (tenant: string, params: GroupsStorageOperationsUpdateParams) => Promise<Group>;
    delete: (tenant: string, params: GroupsStorageOperationsDeleteParams) => Promise<Group>;
}

export interface System {
    version?: string;
}

export interface SystemStorageOperationsCreateParams {
    system: System;
}

export interface SystemStorageOperationsUpdateParams {
    original: System;
    system: System;
}

export interface SystemStorageOperationsFactoryParams {
    plugins: PluginsContainer;
    tenant: string;
}

export interface SystemStorageOperationsFactory {
    (params: SystemStorageOperationsFactoryParams): SystemStorageOperations;
}

export interface SystemStorageOperations {
    get: () => Promise<System>;
    create: (params: SystemStorageOperationsCreateParams) => Promise<System>;
    update: (params: SystemStorageOperationsUpdateParams) => Promise<System>;
}

export interface InstallableParams {
    security: Security;
}

export interface Installable {
    beforeInstall?(params: InstallableParams): Promise<void>;
    afterInstall?(params: InstallableParams): Promise<void>;
    install?(params: InstallableParams): Promise<void>;
    cleanup?(params: InstallableParams): Promise<void>;
}

export interface CrudOptions {
    auth?: boolean;
}

//////////////////////////////////////////////////////////////////////////////////////////////////

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

export interface IdentityStorageOperationsFactoryParams {
    plugins: PluginsContainer;
    tenant: string;
}

export interface IdentityStorageOperationsFactory {
    (params: IdentityStorageOperationsFactoryParams): IdentityStorageOperations;
}

export interface IdentityStorageOperations {
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
}

export interface TenantLink<TData = Record<string, any>> {
    identity: string;
    tenant: string;
    type: string;
    data?: TData;
}

export type GroupTenantLink = TenantLink<{ group: string; permissions: SecurityPermission[] }>;

/* ===== API KEYs ===== */

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

export interface ApiKeysCRUD {
    getApiKey(id: string): Promise<ApiKey>;
    getApiKeyByToken(token: string): Promise<ApiKey>;
    listApiKeys(): Promise<ApiKey[]>;
    createApiKey(data: ApiKeyInput): Promise<ApiKey>;
    updateApiKey(id: string, data: ApiKeyInput): Promise<ApiKey>;
    deleteApiKey(id: string): Promise<boolean>;
}

export interface ApiKeyPermission extends SecurityPermission {
    name: "security.apiKey";
}

export interface ApiKeyStorageOperationsGetParams {
    id: string;
}

export interface ApiKeyStorageOperationsGetByTokenParams {
    token: string;
}

export interface ApiKeyStorageOperationsListParams {
    sort?: string[];
}

export interface ApiKeyStorageOperationsCreateParams {
    apiKey: ApiKey;
}

export interface ApiKeyStorageOperationsUpdateParams {
    original: ApiKey;
    apiKey: ApiKey;
}

export interface ApiKeyStorageOperationsDeleteParams {
    apiKey: ApiKey;
}

interface ApiKeyStorageOperationsFactoryParams {
    plugins: PluginsContainer;
    tenant: string;
}

export interface ApiKeyStorageOperationsFactory {
    (params: ApiKeyStorageOperationsFactoryParams): ApiKeyStorageOperations;
}

export interface ApiKeyStorageOperations {
    get: (params: ApiKeyStorageOperationsGetParams) => Promise<ApiKey>;
    getByToken: (params: ApiKeyStorageOperationsGetByTokenParams) => Promise<ApiKey>;
    list: (params: ApiKeyStorageOperationsListParams) => Promise<ApiKey[]>;
    create: (params: ApiKeyStorageOperationsCreateParams) => Promise<ApiKey>;
    update: (params: ApiKeyStorageOperationsUpdateParams) => Promise<ApiKey>;
    delete: (params: ApiKeyStorageOperationsDeleteParams) => Promise<ApiKey>;
}
