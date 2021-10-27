import { Topic } from "@webiny/pubsub/types";

export interface AdminUsersContext {
    adminUsers: AdminUsers;
}

export interface CreatedBy {
    id: string;
    displayName: string;
    type: string;
}

export interface BaseUserAttributes {
    email: string;
    firstName: string;
    lastName: string;
}

export interface CreateUserInput extends BaseUserAttributes {
    id?: string;
    password: string;
    group?: string;
    avatar?: Record<string, any>;
}

export type UpdateUserInput = Partial<CreateUserInput>;

export interface AdminUser extends BaseUserAttributes {
    id: string;
    tenant: string;
    group?: string;
    avatar?: Record<string, any>;
    createdOn: string;
    createdBy: CreatedBy;
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
    group?: string;
}

export interface AdminUsers {
    onUserBeforeCreate: Topic<CreateUserEvent>;
    onUserAfterCreate: Topic<CreateUserEvent>;
    onUserBeforeUpdate: Topic<BeforeUpdateEvent>;
    onUserAfterUpdate: Topic<AfterUpdateEvent>;
    onUserBeforeDelete: Topic<BeforeDeleteEvent>;
    onUserAfterDelete: Topic<AfterDeleteEvent>;
    onBeforeInstall: Topic<InstallEvent>;
    /**
     * This will be executed during Webiny installation.
     */
    onInstall: Topic<InstallEvent>;
    onAfterInstall: Topic<InstallEvent>;
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
    getVersion(): Promise<string>;
    setVersion(version: string): Promise<System>;
    install(params: InstallParams): Promise<void>;
}

/* Storage Operations */
interface StorageOperationsListUsersParams extends ListUsersParams {
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
    ): Promise<TUser>;
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
    getSystemData(params: StorageOperationsGetSystemParams): Promise<System>;
    createSystemData(params: StorageOperationsCreateSystemParams): Promise<System>;
    updateSystemData(params: StorageOperationsUpdateSystemParams): Promise<System>;
}
