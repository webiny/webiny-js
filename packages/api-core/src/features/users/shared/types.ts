import type { AdminUser } from "~/types/users.js";

// Re-export domain entity
export type { AdminUser };

// Input types
export interface CreateUserInput {
    id?: string;
    displayName?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: Record<string, any> | null;
    groups?: string[];
    teams?: string[];
    password?: string; // Only for Cognito
    external?: boolean;
}

export interface UpdateUserInput {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    avatar?: Record<string, any> | null;
    groups?: string[];
    teams?: string[];
    password?: string; // Only for Cognito
}

export interface GetUserInput {
    id?: string;
    email?: string;
}

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
