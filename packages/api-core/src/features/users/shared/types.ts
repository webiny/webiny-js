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
          /** Look the email up in this tenant instead of the current one. */
          tenant?: string;
      };

export interface GetUserAcrossTenantsInput {
    id: string;
    tenants: string[];
}

export interface ListUserRecordsInput {
    id: string;
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
