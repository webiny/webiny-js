import type { SecurityContext, Team } from "~/types/security.js";
import type { TenancyContext } from "~/types/tenancy.js";

export interface AdminUsersContext extends SecurityContext, TenancyContext {
    adminUsers: AdminUsers;
}

export interface CreatedBy {
    id: string;
    displayName: string | null;
    type: string;
}

export interface BaseUserAttributes {
    // Required fields.
    id: string;
    displayName: string;

    // Required field, but, note that some users coming with a 3rd party IdP might not
    // be able to provide it. In that case, we assign the identity's ID as the email.
    // Check `api-security-okta` package for an example.
    email: string;

    groups?: string[];
    teams?: string[];

    // Optional fields.
    firstName?: string;
    lastName?: string;
    avatar?: Record<string, any> | null;

    // Tells us if the entry has been created based on an identity coming from an external IdP.
    external?: boolean;
}

export interface CreateUserInput extends Omit<BaseUserAttributes, "id" | "displayName"> {
    // ID can be provided, but it's not required. If not provided, it will be auto-generated.
    id?: string;

    // Display name can be provided, but it's not required. If not provided, it will be auto-generated.
    displayName?: string;

    // At the moment, this field is only used by the default Cognito IdP setup.
    // Other IdPs (Auth0, Okta) do not require this field to be present.
    password?: string;
}

export type UpdateUserInput = Partial<Omit<CreateUserInput, "id">>;

export interface AdminUser extends BaseUserAttributes {
    tenant: string;
    createdOn: string;
    createdBy: CreatedBy | null | undefined;
    webinyVersion: string;
}

export interface GetUserParams {
    where: {
        id?: string;
        email?: string;
        tenant?: string;
    };
}

export interface ListUsersParams {
    where?: {
        id_in?: string[];
    };
    sort?: string[];
}

export interface AdminUsers {
    getUser<TUser extends AdminUser = AdminUser>(params: GetUserParams): Promise<TUser>;
    listUsers<TUser extends AdminUser = AdminUser>(params?: ListUsersParams): Promise<TUser[]>;
    listUserTeams(id: string): Promise<Team[]>;
    createUser<TUser extends AdminUser = AdminUser>(data: CreateUserInput): Promise<TUser>;
    updateUser<TUser extends AdminUser = AdminUser>(
        id: string,
        data: UpdateUserInput
    ): Promise<TUser>;
    deleteUser(id: string): Promise<void>;
}

/* Storage Operations */
export interface StorageOperationsListUsersParams extends ListUsersParams {
    where: ListUsersParams["where"] & {
        tenant: string;
    };
}

export interface StorageOperationsGetUserParams extends GetUserParams {
    where: GetUserParams["where"] & {
        tenant: string;
    };
}

export interface StorageOperationsCreateUserParams<TUser> {
    user: TUser;
}

export interface StorageOperationsUpdateUserParams<TUser> {
    user: TUser;
}

export interface StorageOperationsDeleteUserParams<TUser> {
    user: TUser;
}

export interface System {
    tenant: string;
    version: string;
}

export interface AdminUsersStorageOperations {
    getUser<TUser extends AdminUser = AdminUser>(
        params: StorageOperationsGetUserParams
    ): Promise<TUser | null>;

    listUsers<TUser extends AdminUser = AdminUser>(
        params: StorageOperationsListUsersParams
    ): Promise<TUser[]>;

    createUser<TUser extends AdminUser = AdminUser>(
        params: StorageOperationsCreateUserParams<TUser>
    ): Promise<TUser>;

    updateUser<TUser extends AdminUser = AdminUser>(
        params: StorageOperationsUpdateUserParams<TUser>
    ): Promise<TUser>;

    deleteUser<TUser extends AdminUser = AdminUser>(
        params: StorageOperationsDeleteUserParams<TUser>
    ): Promise<void>;
}
