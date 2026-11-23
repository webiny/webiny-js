import type { ApiSession } from "./apiSession.ts";
import type { GraphqlResult } from "./callGraphql.ts";
import { callGraphql, requireData } from "./callGraphql.ts";

/** One permission of a security role, as the role form stores it. */
export interface RolePermission {
    name: string;
    [key: string]: unknown;
}

export interface CreateTestRoleParams {
    name: string;
    slug: string;
    permissions: RolePermission[];
}

interface SecurityError {
    code: string | null;
    message: string | null;
}

interface CreateRoleData {
    security: {
        createRole: {
            data: { id: string } | null;
            error: SecurityError | null;
        };
    };
}

interface DeleteRoleData {
    security: {
        deleteRole: {
            data: boolean | null;
            error: SecurityError | null;
        };
    };
}

const CREATE_ROLE = /* GraphQL */ `
    mutation CreateRole($data: SecurityRoleCreateInput!) {
        security {
            createRole(data: $data) {
                data {
                    id
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

const DELETE_ROLE = /* GraphQL */ `
    mutation DeleteRole($id: ID!) {
        security {
            deleteRole(id: $id) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

/** Creates a role with `permissions`. Returns its id. */
export const createTestRole = async (
    session: ApiSession,
    params: CreateTestRoleParams
): Promise<string> => {
    const result = await callGraphql<CreateRoleData>(session, "graphql", CREATE_ROLE, {
        data: {
            name: params.name,
            slug: params.slug,
            description: "Created by the workflows e2e tests.",
            permissions: params.permissions
        }
    });
    const role = requireData(result, "createRole").security.createRole;
    if (!role.data) {
        throw new Error(`createRole failed: ${role.error?.message}`);
    }
    return role.data.id;
};

const toErrorMessage = (result: GraphqlResult<DeleteRoleData>): string | null => {
    return result.errors?.[0]?.message ?? result.data?.security.deleteRole.error?.message ?? null;
};

/** Deletes the role. Returns the error message, or null when it is gone. */
export const deleteTestRole = async (
    session: ApiSession,
    roleId: string
): Promise<string | null> => {
    const result = await callGraphql<DeleteRoleData>(session, "graphql", DELETE_ROLE, {
        id: roleId
    });
    return toErrorMessage(result);
};
