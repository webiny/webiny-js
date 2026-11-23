import type { ApiSession } from "./apiSession.ts";
import type { GraphqlResult } from "./callGraphql.ts";
import { callGraphql, requireData } from "./callGraphql.ts";

/** A team with a role of its own and no members, to name as a step's reviewing team. */
export interface TestTeam {
    id: string;
    name: string;
    roleId: string;
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

interface CreateTeamData {
    security: {
        createTeam: {
            data: { id: string } | null;
            error: SecurityError | null;
        };
    };
}

interface DeleteData {
    security: {
        deleteRecord: {
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

const CREATE_TEAM = /* GraphQL */ `
    mutation CreateTeam($data: SecurityTeamCreateInput!) {
        security {
            createTeam(data: $data) {
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

const DELETE_TEAM = /* GraphQL */ `
    mutation DeleteTeam($id: ID!) {
        security {
            deleteRecord: deleteTeam(id: $id) {
                data
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
            deleteRecord: deleteRole(id: $id) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

/**
 * Creates a role with no permissions and a team with that role, both named after `runId`. A fresh
 * project has no team, and the admin is in none.
 */
export const createTestTeam = async (session: ApiSession, runId: string): Promise<TestTeam> => {
    const roleResult = await callGraphql<CreateRoleData>(session, "graphql", CREATE_ROLE, {
        data: {
            name: `E2E reviewers role ${runId}`,
            slug: `e2e-reviewers-role-${runId}`,
            description: "Created by the workflows e2e tests.",
            permissions: []
        }
    });
    const role = requireData(roleResult, "createRole").security.createRole;
    if (!role.data) {
        throw new Error(`createRole failed: ${role.error?.message}`);
    }

    const name = `E2E reviewers ${runId}`;
    const teamResult = await callGraphql<CreateTeamData>(session, "graphql", CREATE_TEAM, {
        data: {
            name,
            slug: `e2e-reviewers-${runId}`,
            description: "Created by the workflows e2e tests.",
            roles: [role.data.id]
        }
    });
    const team = requireData(teamResult, "createTeam").security.createTeam;
    if (!team.data) {
        throw new Error(`createTeam failed: ${team.error?.message}`);
    }

    return { id: team.data.id, name, roleId: role.data.id };
};

const toErrorMessage = (result: GraphqlResult<DeleteData>): string | null => {
    return result.errors?.[0]?.message ?? result.data?.security.deleteRecord.error?.message ?? null;
};

/** Deletes the team, then its role. Returns the first error message, or null when both are gone. */
export const deleteTestTeam = async (
    session: ApiSession,
    team: TestTeam
): Promise<string | null> => {
    const teamResult = await callGraphql<DeleteData>(session, "graphql", DELETE_TEAM, {
        id: team.id
    });
    const teamError = toErrorMessage(teamResult);
    if (teamError) {
        return teamError;
    }

    const roleResult = await callGraphql<DeleteData>(session, "graphql", DELETE_ROLE, {
        id: team.roleId
    });
    return toErrorMessage(roleResult);
};
