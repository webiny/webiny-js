import type { ApiSession } from "./apiSession.ts";
import type { GraphqlResult } from "./callGraphql.ts";
import { callGraphql, requireData } from "./callGraphql.ts";
import { createTestRole, deleteTestRole } from "./role.ts";

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

interface CreateTeamData {
    security: {
        createTeam: {
            data: { id: string } | null;
            error: SecurityError | null;
        };
    };
}

interface DeleteTeamData {
    security: {
        deleteTeam: {
            data: boolean | null;
            error: SecurityError | null;
        };
    };
}

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
            deleteTeam(id: $id) {
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
 * project has no team, and the admin is in none. `runId` goes into slugs, so it holds only letters,
 * digits and dashes.
 */
export const createTestTeam = async (session: ApiSession, runId: string): Promise<TestTeam> => {
    const roleId = await createTestRole(session, {
        name: `E2E reviewers role ${runId}`,
        slug: `e2e-reviewers-role-${runId}`,
        permissions: []
    });

    const name = `E2E reviewers ${runId}`;
    const teamResult = await callGraphql<CreateTeamData>(session, "graphql", CREATE_TEAM, {
        data: {
            name,
            slug: `e2e-reviewers-${runId}`,
            description: "Created by the workflows e2e tests.",
            roles: [roleId]
        }
    });
    const team = requireData(teamResult, "createTeam").security.createTeam;
    if (!team.data) {
        throw new Error(`createTeam failed: ${team.error?.message}`);
    }

    return { id: team.data.id, name, roleId };
};

const toErrorMessage = (result: GraphqlResult<DeleteTeamData>): string | null => {
    return result.errors?.[0]?.message ?? result.data?.security.deleteTeam.error?.message ?? null;
};

/**
 * Deletes the team, then its role. Remove its members first. Returns the first error message, or
 * null when both are gone.
 */
export const deleteTestTeam = async (
    session: ApiSession,
    team: TestTeam
): Promise<string | null> => {
    const teamResult = await callGraphql<DeleteTeamData>(session, "graphql", DELETE_TEAM, {
        id: team.id
    });
    const teamError = toErrorMessage(teamResult);
    if (teamError) {
        return teamError;
    }

    return deleteTestRole(session, team.roleId);
};
