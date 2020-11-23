import { Plugin } from "@webiny/plugins/types";
import { Context } from "@webiny/handler/types";
import { SecurityPermission } from "@webiny/api-security/types";

export type SecurityIdentityProviderPlugin<TData = Record<string, any>> = Plugin & {
    name: "security-identity-provider";
    type: "security-identity-provider";
    // Executed each time a user logs in
    onLogin?: (params: { user: User; firstLogin: boolean }, context: Context) => Promise<void>;
    // Create user in a 3rd party identity provider
    createUser: (
        params: { data: CreateUser & TData; permanent?: boolean },
        context: Context
    ) => Promise<void>;
    // Update user in a 3rd party identity provider
    updateUser: (
        params: { data: UpdateUser & TData; user: User },
        context: Context
    ) => Promise<void>;
    // Delete user from a 3rd party identity provider
    deleteUser: (params: { user: User }, context: Context) => Promise<void>;
};

export type Tenant = {
    id: string;
    name: string;
    parent: string | null;
};

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

export type UserAccessToken = {
    id: string;
    name: string;
    token: string;
    login: string;
    createdOn: string;
};

type TenantAccess = {
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

type CreateTenant = {
    id?: string;
    name: string;
    parent: string | null;
};

type UpdateTenant = {
    name: string;
};

export type CreateUser = {
    login: string;
    firstName: string;
    lastName: string;
    avatar?: Record<string, any>;
    group?: string;
};

export type UpdateUser = Partial<Omit<CreateUser, "login">>;

export type GroupData = {
    name: string;
    slug: string;
    description: string;
    system: boolean;
    permissions: SecurityPermission[];
};

export type CreateUserAccessToken = {
    name: string;
    token: string;
};
export type UpdateUserAccessToken = {
    name: string;
};

export type TenantsCRUD = {
    getRootTenant(): Promise<Tenant>;
    getTenant(id: string): Promise<Tenant>;
    listTenants(params: { parent?: string }): Promise<Tenant[]>;
    createTenant(data: CreateTenant): Promise<Tenant>;
    updateTenant(id: string, data: UpdateTenant): Promise<boolean>;
    deleteTenant(id: string): Promise<boolean>;
};

export type GroupsCRUD = {
    getGroup(tenant: Tenant, slug: string): Promise<Group>;
    listGroups(tenant: Tenant): Promise<Group[]>;
    createGroup(tenant: Tenant, data: GroupData): Promise<Group>;
    updateGroup(tenant: Tenant, slug: string, data: Partial<GroupData>): Promise<boolean>;
    deleteGroup(tenant: Tenant, slug: string): Promise<boolean>;
    updateUserLinks(tenant: Tenant, group: Group): Promise<void>;
};

export type UsersCRUD = {
    getUser(login: string): Promise<User>;
    listUsers(params?: { tenant: string }): Promise<User[]>;
    createUser(data: CreateUser): Promise<User>;
    updateUser(login: string, data: UpdateUser): Promise<UpdateUser>;
    deleteUser(login: string): Promise<boolean>;
    linkUserToTenant(login: string, tenant: Tenant, group: Group): Promise<void>;
    unlinkUserFromTenant(login: string, tenant: Tenant): Promise<void>;
    getUserAccess(login: string): Promise<TenantAccess[]>;
    getAccessToken(login: string, tokenId: string): Promise<UserAccessToken>;
    getUserByPAT(token: string): Promise<User>;
    listTokens(login: string): Promise<UserAccessToken[]>;
    createToken(login: string, data: CreateUserAccessToken): Promise<UserAccessToken>;
    updateToken(
        login: string,
        tokenId: string,
        data: UpdateUserAccessToken
    ): Promise<UpdateUserAccessToken>;
    deleteToken(login: string, tokenId: string): Promise<boolean>;
};

export type TenancyContextObject = {
    // Get current tenant (loaded using X-Tenant header)
    getTenant(): Tenant;
    // Set current tenant (only if tenant is not already set)
    setTenant(tenant: Tenant): void;
    tenants?: TenantsCRUD;
    users?: UsersCRUD;
    groups?: GroupsCRUD;
};

export type TenancyContext = {
    security: TenancyContextObject;
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
