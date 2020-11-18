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
        params: { data: CreateUserData & TData; permanent?: boolean },
        context: Context
    ) => Promise<void>;
    // Update user in a 3rd party identity provider
    updateUser: (
        params: { data: UpdateUserData & TData; user: User },
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

export type TenantData = {
    id?: string;
    name: string;
    parent: string | null;
};

export type CreateUserData = {
    login: string;
    firstName: string;
    lastName: string;
    avatar?: Record<string, any>;
    group?: string;
};

export type UpdateUserData = Partial<Omit<CreateUserData, "login">>;

export type GroupData = {
    name: string;
    slug: string;
    description: string;
    system: boolean;
    permissions: SecurityPermission[];
};

export type TenantsCRUD = {
    getRootTenant(): Promise<Tenant>;
    getTenant(id: string): Promise<Tenant>;
    listTenants(params: { parent?: string }): Promise<Tenant[]>;
    createTenant(data: TenantData): Promise<Tenant>;
    updateTenant(id: string, data: Partial<TenantData>): Promise<boolean>;
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
    createUser(data: CreateUserData): Promise<User>;
    updateUser(login: string, data: UpdateUserData): Promise<UpdateUserData>;
    deleteUser(login: string): Promise<boolean>;
    linkUserToTenant(login: string, tenant: Tenant, group: Group): Promise<void>;
    unlinkUserFromTenant(login: string, tenant: Tenant): Promise<void>;
    getUserAccess(login: string): Promise<TenantAccess[]>;
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
