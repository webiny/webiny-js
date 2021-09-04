import { SecurityPermission } from "@webiny/api-security/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { SecurityIdentity } from "@webiny/api-security/types";

export interface CreatedBy {
    id: string;
    displayName: string;
    type: string;
}

export interface User {
    /**
     * Added for the storage operations refactoring.
     */
    id: string;
    /**
     * Old ID.
     */
    login: string;
    firstName: string;
    lastName: string;
    avatar?: Record<string, any>;
    createdOn: string;
    createdBy: CreatedBy;
}

export interface UserPersonalAccessToken {
    id: string;
    name: string;
    token: string;
    login: string;
    createdOn: string;
}

export interface CreateUserInput {
    login: string;
    firstName: string;
    lastName: string;
    avatar?: Record<string, any>;
    group?: string;
}

export type UpdateUserInput = Partial<Omit<CreateUserInput, "login">>;

export interface GroupInput {
    name: string;
    slug: string;
    description: string;
    system: boolean;
    permissions: SecurityPermission[];
}

export interface CreatePersonalAccessTokenInput {
    name: string;
    token: string;
}

export interface UpdatePersonalAccessTokenInput {
    name: string;
}

/**
 * @private
 * @internal
 */
export interface CrudOptions {
    auth?: boolean;
}

interface UsersCRUDListUsersParams {
    tenant?: string;
}

export interface UsersCRUD {
    login(): Promise<User>;
    getUser(login: string, options?: CrudOptions): Promise<User>;
    listUsers(params?: UsersCRUDListUsersParams, options?: CrudOptions): Promise<User[]>;
    createUser(data: CreateUserInput, options?: CrudOptions): Promise<User>;
    updateUser(login: string, data: UpdateUserInput): Promise<User>;
    deleteUser(login: string): Promise<boolean>;
    getPersonalAccessToken(login: string, tokenId: string): Promise<UserPersonalAccessToken>;
    getUserByPersonalAccessToken(token: string): Promise<User>;
    listTokens(login: string): Promise<UserPersonalAccessToken[]>;
    createToken(data: CreatePersonalAccessTokenInput): Promise<UserPersonalAccessToken>;
    updateToken(
        tokenId: string,
        data: UpdatePersonalAccessTokenInput
    ): Promise<UpdatePersonalAccessTokenInput>;
    deleteToken(tokenId: string): Promise<boolean>;
}

/**
 * @category StorageOperations
 * @category UserStorageOperations
 */
export interface UserStorageOperationsGetParams {
    id: string;
}
/**
 * @category StorageOperations
 * @category UserStorageOperations
 */
export interface UserStorageOperationsGetUserByPatParams {
    token: string;
}

/**
 * @category StorageOperations
 * @category UserStorageOperations
 */
export interface UserStorageOperationsListParamsWhere {
    tenant?: string;
    id_in?: string[];
}

/**
 * @category StorageOperations
 * @category UserStorageOperations
 */
export interface UserStorageOperationsListParams {
    where: UserStorageOperationsListParamsWhere;
    sort?: string[];
}

/**
 * @category StorageOperations
 * @category UserStorageOperations
 */
export interface UserStorageOperationsCreateParams {
    user: User;
}

/**
 * @category StorageOperations
 * @category UserStorageOperations
 */
export interface UserStorageOperationsUpdateParams {
    user: User;
    original: User;
}

/**
 * @category StorageOperations
 * @category UserStorageOperations
 */
export interface UserStorageOperationsDeleteParams {
    user: User;
}

/**
 * @category StorageOperations
 * @category UserStorageOperations
 */
export interface UserStorageOperationsCreateTokenParams {
    identity: SecurityIdentity;
    token: UserPersonalAccessToken;
}

/**
 * @category StorageOperations
 * @category UserStorageOperations
 */
export interface UserStorageOperationsUpdateTokenParams {
    original: UserPersonalAccessToken;
    token: UserPersonalAccessToken;
}

/**
 * @category StorageOperations
 * @category UserStorageOperations
 */
export interface UserStorageOperationsDeleteTokenParams {
    identity: SecurityIdentity;
    token: UserPersonalAccessToken;
}

/**
 * @category StorageOperations
 * @category UserStorageOperations
 */
export interface UserStorageOperationsGetTokenParams {
    login: string;
    tokenId: string;
}

/**
 * @category StorageOperations
 * @category UserStorageOperations
 */
export interface UserStorageOperationsListTokensParams {
    login: string;
}

/**
 * @category StorageOperations
 * @category UserStorageOperations
 */
export interface UserStorageOperations {
    // users
    getUser: (params: UserStorageOperationsGetParams) => Promise<User>;
    getUserByPersonalAccessToken: (
        params: UserStorageOperationsGetUserByPatParams
    ) => Promise<User>;
    listUsers: (params: UserStorageOperationsListParams) => Promise<User[]>;
    createUser: (params: UserStorageOperationsCreateParams) => Promise<User>;
    updateUser: (params: UserStorageOperationsUpdateParams) => Promise<User>;
    /**
     * Delete the user and the tokens that are connected to the user.
     */
    deleteUser: (params: UserStorageOperationsDeleteParams) => Promise<User>;
    // tokens
    createToken: (
        params: UserStorageOperationsCreateTokenParams
    ) => Promise<UserPersonalAccessToken>;
    updateToken: (
        params: UserStorageOperationsUpdateTokenParams
    ) => Promise<UserPersonalAccessToken>;
    deleteToken: (
        params: UserStorageOperationsDeleteTokenParams
    ) => Promise<UserPersonalAccessToken>;
    getPersonalAccessToken: (
        params: UserStorageOperationsGetTokenParams
    ) => Promise<UserPersonalAccessToken>;
    listTokens: (
        params: UserStorageOperationsListTokensParams
    ) => Promise<UserPersonalAccessToken[]>;
}
