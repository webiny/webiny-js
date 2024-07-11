import { Topic } from "@webiny/pubsub/types";
import { SecurityContext } from "@webiny/api-security/types";
import { TenancyContext } from "@webiny/api-tenancy/types";

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
    avatar?: Record<string, any>;
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

export interface CreateUserEvent {
    /**
     * New user attributes.
     */
    user: AdminUser;
    /**
     * Input data used to create the new user (e.g., from GraphQL resolver).
     */
    inputData: CreateUserInput;
}

export interface BeforeUpdateEvent {
    /**
     * User object that will be updated.
     */
    user: AdminUser;
    /**
     * Input data that should update the existing user (e.g., from GraphQL resolver).
     */
    readonly inputData: Record<string, any>;
    /**
     * An object containing values that will be assigned to `user`.
     * This object is a clone of the `inputData`, and it gives you an opportunity to validate input,
     * or add/remove/modify attributes before they're assigned to the original `user` record.
     * `updateData` is assigned to the `user` object using simple `Object.assign`.
     */
    updateData: Partial<Omit<AdminUser, "id">>;
}

export interface AfterUpdateEvent {
    /**
     * User object that was updated.
     */
    updatedUser: AdminUser;

    /**
     * User object prior to being updated.
     */
    originalUser: AdminUser;

    /**
     * Input data (e.g., from GraphQL resolver).
     */
    readonly inputData: Record<string, any>;
}

export interface BeforeDeleteEvent {
    /**
     * User to be deleted.
     */
    user: AdminUser;
}

export interface AfterDeleteEvent {
    /**
     * User that was deleted.
     */
    user: AdminUser;
}

export interface CreateErrorEvent {
    user: AdminUser;
    inputData: CreateUserInput;
    error: Error;
}

export interface UpdateErrorEvent {
    user: AdminUser;
    inputData: UpdateUserInput;
    error: Error;
}

export interface DeleteErrorEvent {
    user: AdminUser;
    error: Error;
}

export interface ErrorEvent extends InstallEvent {
    error: Error;
}

export interface InstallEvent {
    tenant: string;
    user: InstallParams;
}

export interface InstallParams {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    groups?: string[];
    teams?: string[];
}

export interface AdminUsers {
    onUserBeforeCreate: Topic<CreateUserEvent>;
    onUserAfterCreate: Topic<CreateUserEvent>;
    onUserBeforeUpdate: Topic<BeforeUpdateEvent>;
    onUserAfterUpdate: Topic<AfterUpdateEvent>;
    onUserBeforeDelete: Topic<BeforeDeleteEvent>;
    onUserAfterDelete: Topic<AfterDeleteEvent>;
    onSystemBeforeInstall: Topic<InstallEvent>;

    /**
     * Errors
     */
    onUserCreateError: Topic<CreateErrorEvent>;
    onUserUpdateError: Topic<UpdateErrorEvent>;
    onUserDeleteError: Topic<DeleteErrorEvent>;

    /**
     * This will be executed during Webiny installation.
     */
    onInstall: Topic<InstallEvent>;
    onSystemAfterInstall: Topic<InstallEvent>;
    onCleanup: Topic<ErrorEvent>;

    getStorageOperations(): AdminUsersStorageOperations;

    isEmailTaken(email: string): Promise<void>;

    getUser<TUser extends AdminUser = AdminUser>(params: GetUserParams): Promise<TUser>;

    listUsers<TUser extends AdminUser = AdminUser>(params?: ListUsersParams): Promise<TUser[]>;

    createUser<TUser extends AdminUser = AdminUser>(data: CreateUserInput): Promise<TUser>;

    updateUser<TUser extends AdminUser = AdminUser>(
        id: string,
        data: UpdateUserInput
    ): Promise<TUser>;

    deleteUser(id: string): Promise<void>;

    getVersion(): Promise<string | null>;

    setVersion(version: string): Promise<System>;

    install(params: InstallParams): Promise<void>;
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

export interface StorageOperationsGetSystemParams {
    tenant: string;
}

export interface StorageOperationsCreateSystemParams {
    system: System;
}

export interface StorageOperationsUpdateSystemParams {
    system: System;
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

    getSystemData(params: StorageOperationsGetSystemParams): Promise<System | null>;

    createSystemData(params: StorageOperationsCreateSystemParams): Promise<System>;

    updateSystemData(params: StorageOperationsUpdateSystemParams): Promise<System>;
}
