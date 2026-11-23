import type { ApiSession } from "./apiSession.ts";
import { callGraphql, requireData } from "./callGraphql.ts";

/** An admin user the test created, to sign in as. */
export interface TestUser {
    id: string;
    email: string;
    displayName: string;
}

export interface CreateTestUserParams {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    roleIds: string[];
    teamIds: string[];
}

interface AdminUsersError {
    code: string | null;
    message: string | null;
    data: unknown;
}

interface CreateUserData {
    adminUsers: {
        createUser: {
            data: TestUser | null;
            error: AdminUsersError | null;
        };
    };
}

interface UpdateUserData {
    adminUsers: {
        updateUser: {
            error: AdminUsersError | null;
        };
    };
}

interface DeleteUserData {
    adminUsers: {
        deleteUser: {
            error: AdminUsersError | null;
        };
    };
}

const CREATE_USER = /* GraphQL */ `
    mutation CreateUser($data: AdminUsersCreateInput!) {
        adminUsers {
            createUser(data: $data) {
                data {
                    id
                    email
                    displayName
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

const UPDATE_USER = /* GraphQL */ `
    mutation UpdateUser($id: ID!, $data: AdminUsersUpdateInput!) {
        adminUsers {
            updateUser(id: $id, data: $data) {
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

const DELETE_USER = /* GraphQL */ `
    mutation DeleteUser($id: ID!) {
        adminUsers {
            deleteUser(id: $id) {
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

/**
 * Creates an admin user with a password, roles and teams, ready to sign in with that password.
 *
 * On Cognito `createUser` sets the password as temporary, so the first sign-in would have to set a
 * new one; `updateUser` with the same password makes it permanent. Self-hosted auth stores the
 * password as given, and setting it again changes nothing.
 */
export const createTestUser = async (
    session: ApiSession,
    params: CreateTestUserParams
): Promise<TestUser> => {
    const createResult = await callGraphql<CreateUserData>(session, "graphql", CREATE_USER, {
        data: {
            email: params.email,
            firstName: params.firstName,
            lastName: params.lastName,
            password: params.password,
            roles: params.roleIds,
            teams: params.teamIds
        }
    });
    const created = requireData(createResult, "createUser").adminUsers.createUser;
    if (!created.data) {
        throw new Error(`createUser failed: ${created.error?.code} ${created.error?.message}`);
    }

    const updateResult = await callGraphql<UpdateUserData>(session, "graphql", UPDATE_USER, {
        id: created.data.id,
        data: { password: params.password }
    });
    const updated = requireData(updateResult, "updateUser").adminUsers.updateUser;
    if (updated.error) {
        throw new Error(`updateUser failed: ${updated.error.code} ${updated.error.message}`);
    }

    return created.data;
};

/** Deletes the user, from the identity provider too. Returns the error message, or null. */
export const deleteTestUser = async (
    session: ApiSession,
    user: TestUser
): Promise<string | null> => {
    const result = await callGraphql<DeleteUserData>(session, "graphql", DELETE_USER, {
        id: user.id
    });
    return result.errors?.[0]?.message ?? result.data?.adminUsers.deleteUser.error?.message ?? null;
};
