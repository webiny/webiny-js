import { ContextInterface } from "@webiny/handler/types";
import { SecurityContextBase, SecurityPermission } from "@webiny/api-security/types";
import { TenancyContext, Tenant } from "@webiny/api-tenancy/types";
import { HttpContext } from "@webiny/handler-http/types";
import { DbContext } from "@webiny/handler-db/types";

export type CreatedBy = {
    id: string;
    displayName: string;
    type: string;
};

export type Group = {
    tenant: string;
    createdOn: string;
    createdBy: CreatedBy;
    name: string;
    slug: string;
    description: string;
    system: boolean;
    permissions: SecurityPermission[];
};

export type User = {
    login: string;
    firstName: string;
    lastName: string;
    avatar?: Record<string, any>;
    createdOn: string;
    createdBy: CreatedBy;
};

export type UserPersonalAccessToken = {
    id: string;
    name: string;
    token: string;
    login: string;
    createdOn: string;
};

export type TenantAccess = {
    tenant: {
        id: string;
        name: string;
    };
    group: {
        slug: string;
        name: string;
        permissions: SecurityPermission[];
    };
};

export type CreateUserInput = {
    login: string;
    firstName: string;
    lastName: string;
    avatar?: Record<string, any>;
    group?: string;
};

export type UpdateUserInput = Partial<Omit<CreateUserInput, "login">>;

export type GroupInput = {
    name: string;
    slug: string;
    description: string;
    system: boolean;
    permissions: SecurityPermission[];
};

export type CreatePersonalAccessTokenInput = {
    name: string;
    token: string;
};
export type UpdatePersonalAccessTokenInput = {
    name: string;
};

export type ApiKey = {
    id: string;
    name: string;
    description: string;
    token: string;
    permissions: SecurityPermission[];
    createdBy: CreatedBy;
    createdOn: string;
};

export type ApiKeyInput = {
    name: string;
    description: string;
    permissions: SecurityPermission[];
};

export type SystemCRUD = {
    getVersion(): Promise<string>;
    setVersion(version: string): Promise<void>;
    upgrade(version: string, data?: Record<string, any>): Promise<boolean>;
};

export type GroupsCRUD = {
    getGroup(tenant: Tenant, slug: string): Promise<Group>;
    listGroups(tenant: Tenant): Promise<Group[]>;
    createGroup(tenant: Tenant, data: GroupInput): Promise<Group>;
    updateGroup(tenant: Tenant, slug: string, data: Partial<GroupInput>): Promise<boolean>;
    deleteGroup(tenant: Tenant, slug: string): Promise<boolean>;
    updateUserLinks(tenant: Tenant, group: Group): Promise<void>;
};

export interface UsersCRUD {
    login(): Promise<User>;
    getUser(login: string, options?: { auth?: boolean }): Promise<User>;
    listUsers(options?: { tenant?: string; auth?: boolean }): Promise<User[]>;
    createUser(data: CreateUserInput, options?: { auth?: boolean }): Promise<User>;
    updateUser(login: string, data: UpdateUserInput): Promise<User>;
    deleteUser(login: string): Promise<boolean>;
    linkUserToTenant(login: string, tenant: Tenant, group: Group): Promise<void>;
    unlinkUserFromTenant(login: string, tenant: Tenant): Promise<void>;
    getUserAccess(login: string): Promise<TenantAccess[]>;
    getPersonalAccessToken(login: string, tokenId: string): Promise<UserPersonalAccessToken>;
    getUserByPersonalAccessToken(token: string): Promise<User>;
    listTokens(login: string): Promise<UserPersonalAccessToken[]>;
    createToken(
        login: string,
        data: CreatePersonalAccessTokenInput
    ): Promise<UserPersonalAccessToken>;
    updateToken(
        login: string,
        tokenId: string,
        data: UpdatePersonalAccessTokenInput
    ): Promise<UpdatePersonalAccessTokenInput>;
    deleteToken(login: string, tokenId: string): Promise<boolean>;
}

export type ApiKeysCRUD = {
    getApiKey(id: string): Promise<ApiKey>;
    getApiKeyByToken(token: string): Promise<ApiKey>;
    listApiKeys(): Promise<ApiKey[]>;
    createApiKey(data: ApiKeyInput): Promise<ApiKey>;
    updateApiKey(id: string, data: ApiKeyInput): Promise<ApiKey>;
    deleteApiKey(id: string): Promise<boolean>;
};

// Helper types when working with database
export type DbItemSecurityUser2Tenant = {
    PK: string;
    SK: string;
    TYPE: "SecurityUser2Tenant";
    tenant: {
        id: string;
        name: string;
    };
    group: {
        slug: string;
        name: string;
        permissions: SecurityPermission[];
    };
};

export interface ApiKeyPermission extends SecurityPermission {
    name: "security.apiKey";
}

export type AdminUsers = {
    users?: UsersCRUD;
    groups?: GroupsCRUD;
    apiKeys?: ApiKeysCRUD;
    system?: SystemCRUD;
};

export interface AdminUsersContext
    extends TenancyContext,
        ContextInterface,
        HttpContext,
        DbContext {
    security: AdminUsers & SecurityContextBase;
}
