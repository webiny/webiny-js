import { Plugin } from "@webiny/graphql/types";
import { Context } from "@webiny/graphql/types";
import { SecurityPermission } from "@webiny/api-security/types";

export type SecurityUserManagementPlugin = Plugin & {
    name: "security-user-management";
    type: "security-user-management";
    // Executed each time a user logs in
    onLogin?: (params: { user; firstLogin: boolean }, context: Context) => Promise<void>;
    // Create user in a 3rd party identity provider
    createUser: (params: { data; user; permanent?: boolean }, context: Context) => Promise<void>;
    // Update user in a 3rd party identity provider
    updateUser: (params: { data; user }, context: Context) => Promise<void>;
    // Delete user from a 3rd party identity provider
    deleteUser: (params: { user }, context: Context) => Promise<void>;
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
    createdOn: string;
    createdBy: CreatedBy;
    name: string;
    slug: string;
    description: string;
    system: boolean;
    permissions: SecurityPermission[];
};

export type User = {
    createdOn: string;
    createdBy: CreatedBy;
    login: string;
    firstName: string;
    lastName: string;
    avatar?: Record<string, any>;
};

type TenantWithPermissions = {
    id: string;
    name: string;
    permissions: SecurityPermission[];
};

export type TenantData = {
    id?: string;
    name: string;
    parent: string | null;
};

export type UserData = {
    login: string;
    firstName: string;
    lastName: string;
    avatar?: Record<string, any>;
};

export type GroupData = {
    name: string;
    slug: string;
    description: string;
    system: boolean;
    permissions: SecurityPermission[];
};

export type TenantsCRUD = {
    getRoot(): Promise<Tenant>;
    get(id: string): Promise<Tenant>;
    list(params: { parent?: string }): Promise<Tenant[]>;
    create(data: TenantData): Promise<Tenant>;
    update(id: string, data: Partial<TenantData>): Promise<boolean>;
    delete(id: string): Promise<boolean>;
    getUserPermissions(login: string): Promise<TenantWithPermissions[]>;
    linkUser(tenant: Tenant, login: string, group: Group): Promise<void>;
    unlinkUser(tenant: Tenant, login: string): Promise<void>;
};

export type GroupsCRUD = {
    get(slug: string): Promise<Group>;
    list(): Promise<Group[]>;
    create(data: GroupData): Promise<Group>;
    update(slug: string, data: Partial<GroupData>): Promise<boolean>;
    delete(slug: string): Promise<boolean>;
};

export type UsersCRUD = {
    get(login: string): Promise<User>;
    list(params?: { tenant: string }): Promise<User[]>;
    create(data: UserData): Promise<User>;
    update(login: string, data: Partial<UserData>): Promise<boolean>;
    delete(login: string): Promise<boolean>;
};

export type HandlerTenancyContextObject = {
    withTenantId(value: string): string;
    // Get current tenant (loaded using X-Tenant header)
    getTenant(): Tenant;
    // Set current tenant (only if tenant is not already loaded)
    setTenant(tenant: Tenant): void;
    tenants?: TenantsCRUD;
    users?: UsersCRUD;
    groups?: GroupsCRUD;
};

export type HandlerTenancyContext = {
    security: HandlerTenancyContextObject;
};
