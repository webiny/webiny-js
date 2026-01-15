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
    password?: string; // Only for Cognito
    external?: boolean;
}

export interface UpdateUserInput {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    avatar?: Record<string, any> | null;
    roles?: string[];
    teams?: string[];
    password?: string; // Only for Cognito
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

export interface ListUsersInput {
    where?: {
        id_in?: string[];
    };
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

export interface StorageOperationsListUsersParams {
    where: {
        tenant: string;
        id_in?: string[];
    };
    sort?: string[];
}
