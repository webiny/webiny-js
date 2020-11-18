import { Plugin } from "@webiny/handler-graphql/types";
import { Context } from "@webiny/handler-graphql/types";
import { SecurityPermission } from "@webiny/api-security/types";
export declare type SecurityIdentityProviderPlugin<TData = Record<string, any>> = Plugin & {
    name: "security-identity-provider";
    type: "security-identity-provider";
    onLogin?: (params: {
        user: User;
        firstLogin: boolean;
    }, context: Context) => Promise<void>;
    createUser: (params: {
        data: CreateUserData & TData;
        permanent?: boolean;
    }, context: Context) => Promise<void>;
    updateUser: (params: {
        data: UpdateUserData & TData;
        user: User;
    }, context: Context) => Promise<void>;
    deleteUser: (params: {
        user: User;
    }, context: Context) => Promise<void>;
};
export declare type Tenant = {
    id: string;
    name: string;
    parent: string | null;
};
export declare type CreatedBy = {
    id: string;
    displayName: string;
    type: string;
};
export declare type Group = {
    tenant: string;
    createdOn: string;
    createdBy: CreatedBy;
    name: string;
    slug: string;
    description: string;
    system: boolean;
    permissions: SecurityPermission[];
};
export declare type User = {
    login: string;
    firstName: string;
    lastName: string;
    avatar?: Record<string, any>;
    createdOn: string;
    createdBy: CreatedBy;
};
declare type TenantAccess = {
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
export declare type TenantData = {
    id?: string;
    name: string;
    parent: string | null;
};
export declare type CreateUserData = {
    login: string;
    firstName: string;
    lastName: string;
    avatar?: Record<string, any>;
    group?: string;
};
export declare type UpdateUserData = Partial<Omit<CreateUserData, "login">>;
export declare type GroupData = {
    name: string;
    slug: string;
    description: string;
    system: boolean;
    permissions: SecurityPermission[];
};
export declare type TenantsCRUD = {
    getRootTenant(): Promise<Tenant>;
    getTenant(id: string): Promise<Tenant>;
    listTenants(params: {
        parent?: string;
    }): Promise<Tenant[]>;
    createTenant(data: TenantData): Promise<Tenant>;
    updateTenant(id: string, data: Partial<TenantData>): Promise<boolean>;
    deleteTenant(id: string): Promise<boolean>;
};
export declare type GroupsCRUD = {
    getGroup(tenant: Tenant, slug: string): Promise<Group>;
    listGroups(tenant: Tenant): Promise<Group[]>;
    createGroup(tenant: Tenant, data: GroupData): Promise<Group>;
    updateGroup(tenant: Tenant, slug: string, data: Partial<GroupData>): Promise<boolean>;
    deleteGroup(tenant: Tenant, slug: string): Promise<boolean>;
    updateUserLinks(tenant: Tenant, group: Group): Promise<void>;
};
export declare type UsersCRUD = {
    getUser(login: string): Promise<User>;
    listUsers(params?: {
        tenant: string;
    }): Promise<User[]>;
    createUser(data: CreateUserData): Promise<User>;
    updateUser(login: string, data: UpdateUserData): Promise<UpdateUserData>;
    deleteUser(login: string): Promise<boolean>;
    linkUserToTenant(login: string, tenant: Tenant, group: Group): Promise<void>;
    unlinkUserFromTenant(login: string, tenant: Tenant): Promise<void>;
    getUserAccess(login: string): Promise<TenantAccess[]>;
};
export declare type TenancyContextObject = {
    getTenant(): Tenant;
    setTenant(tenant: Tenant): void;
    tenants?: TenantsCRUD;
    users?: UsersCRUD;
    groups?: GroupsCRUD;
};
export declare type TenancyContext = {
    security: TenancyContextObject;
};
export declare type DbItemSecurityUser2Tenant = {
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
export {};
