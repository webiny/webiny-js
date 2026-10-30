import type { AdminUser } from "~/types/users.js";

export type { AdminUser };

// Input types
export interface CreateUserInput {
    id?: string;
    displayName?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: Record<string, any> | null;
    roles?: string[];
    teams?: string[];
    external?: boolean;
}

export interface UpdateUserInput {
    displayName?: string;
    firstName?: string;
    email?: string;
    lastName?: string;
    avatar?: Record<string, any> | null;
    roles?: string[];
    teams?: string[];
}

export type GetUserInput =
    | {
          id: string;
          email?: never;
      }
    | {
          id?: never;
          email: string;
      };

export interface ListUsersWhere {
    id_in?: string[];
    teams_in?: string[];
}

export interface ListUsersInput {
    where?: ListUsersWhere;
    sort?: string[];
}

// Storage operation types (internal)
export interface StorageOperationsGetUserParams {
    where: {
        tenant: string;
        id?: string;
        email?: string;
    };
}

export interface StorageOperationsListUsersWhere extends ListUsersWhere {
    tenant: string;
}

export interface StorageOperationsListUsersParams {
    where: StorageOperationsListUsersWhere;
    sort?: string[];
}
