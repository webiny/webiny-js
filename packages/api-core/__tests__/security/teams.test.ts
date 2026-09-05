import { describe, test, expect, beforeEach } from "vitest";
import { useGqlHandler } from "../useGqlHandler";
import mocks from "../mocks/securityTeam";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense";
import { RoleFactory } from "~/features/security/roles/shared/abstractions.js";
import { TeamFactory } from "~/features/security/teams/shared/abstractions.js";
import { getStorageOps } from "~/testing/environment.js";
import type { ApiCoreStorageOperations } from "~/types/core.js";

class TestRoleFactory implements RoleFactory.Interface {
    execute(): RoleFactory.Return {
        return [
            {
                name: "Test Team 1",
                slug: "test-team-1",
                description: "1st test team defined via an extension.",
                permissions: [{ name: "cms.*" }]
            },
            {
                name: "Test Team 2",
                slug: "test-team-2",
                description: "2nd test team defined via an extension.",
                permissions: [{ name: "pb.*" }]
            }
        ];
    }
}

class TestTeamFactory implements TeamFactory.Interface {
    execute(): TeamFactory.Return {
        return [
            {
                name: "Test Team 2",
                slug: "test-team-2",
                description: "2nd test team defined via an extension.",
                roles: ["test-team-1"]
            },
            {
                name: "Test Team 1",
                slug: "test-team-1",
                description: "1st test team defined via an extension.",
                roles: ["test-team-2"]
            }
        ];
    }
}

const testRoleFactory = RoleFactory.createImplementation({
    implementation: TestRoleFactory,
    dependencies: []
});

const testTeamFactory = TeamFactory.createImplementation({
    implementation: TestTeamFactory,
    dependencies: []
});

describe("Security Team CRUD Test", () => {
    const { install, securityTeam } = useGqlHandler({
        wcpLicense: createTestWcpLicense(),
        registrations: [testRoleFactory, testTeamFactory]
    });

    beforeEach(async () => {
        await install.install();
    });

    test("should able to create, read, update and delete `Security Teams`", async () => {
        const [responseA] = await securityTeam.create({ data: mocks.teamA });

        // Let's create two teams.
        const teamA = responseA.data.security.createTeam.data;
        expect(teamA).toEqual({ id: teamA.id, ...mocks.teamA });

        const [responseB] = await securityTeam.create({ data: mocks.teamB });

        const teamB = responseB.data.security.createTeam.data;
        expect(teamB).toEqual({ id: teamB.id, ...mocks.teamB });

        // Let's check whether both of the team exists
        const [listResponse] = await securityTeam.list();

        expect(listResponse.data.security.listTeams).toEqual({
            data: [
                {
                    name: "Test Team 2",
                    description: "2nd test team defined via an extension.",
                    slug: "test-team-2",
                    roles: [
                        {
                            id: "test-team-1",
                            name: "Test Team 1"
                        }
                    ]
                },
                {
                    name: "Test Team 1",
                    description: "1st test team defined via an extension.",
                    slug: "test-team-1",
                    roles: [
                        {
                            id: "test-team-2",
                            name: "Test Team 2"
                        }
                    ]
                },
                {
                    name: "Team-A",
                    description: "A: Dolor odit et quia animi ipsum nostrum nesciunt.",
                    slug: "team-a",
                    roles: []
                },
                {
                    name: "Team-B",
                    description: "B: Dolor odit et quia animi ipsum nostrum nesciunt.",
                    slug: "team-b",
                    roles: []
                }
            ],
            error: null
        });

        // Let's update the "teamB" name
        const updatedName = "Team B - updated";
        const [updateB] = await securityTeam.update({
            id: teamB.id,
            data: {
                name: updatedName
            }
        });

        expect(updateB).toEqual({
            data: {
                security: {
                    updateTeam: {
                        data: {
                            ...mocks.teamB,
                            name: updatedName
                        },
                        error: null
                    }
                }
            }
        });

        // Let's delete  "teamB"
        const [deleteB] = await securityTeam.delete({
            id: teamB.id
        });

        expect(deleteB).toEqual({
            data: {
                security: {
                    deleteTeam: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        // Should not contain "teamB"
        const [getB] = await securityTeam.get({ id: teamB.id });

        expect(getB).toMatchObject({
            data: {
                security: {
                    getTeam: {
                        data: null,
                        error: {
                            code: "TEAM_NOT_FOUND",
                            data: null
                        }
                    }
                }
            }
        });

        // Should contain "teamA" by slug
        const [getA] = await securityTeam.get({ id: teamA.id });

        expect(getA).toEqual({
            data: {
                security: {
                    getTeam: {
                        data: mocks.teamA,
                        error: null
                    }
                }
            }
        });
    });

    // `description` is declared `String` (nullable) in the GraphQL schema, so clients may send
    // `null` - and the admin app does exactly that when it reads a team saved without a
    // description and submits the edit form again. Both schemas used Zod's `.optional()`, which
    // accepts only `undefined`, so these requests failed with "Invalid input: expected string,
    // received null".
    test("should accept a null `description` on create and update", async () => {
        const [createResponse] = await securityTeam.create({
            data: { ...mocks.teamA, description: null }
        });

        expect(createResponse).toMatchObject({
            data: {
                security: {
                    createTeam: {
                        data: { name: "Team-A", slug: "team-a", description: "" },
                        error: null
                    }
                }
            }
        });

        const team = createResponse.data.security.createTeam.data;

        const [updateResponse] = await securityTeam.update({
            id: team.id,
            data: { description: null }
        });

        expect(updateResponse).toMatchObject({
            data: {
                security: {
                    updateTeam: {
                        data: { name: "Team-A", slug: "team-a", description: "" },
                        error: null
                    }
                }
            }
        });
    });

    // An update that does not mention `description` must leave the stored one alone. Easy to break
    // while making the field accept null, because a Zod `.transform()` on an optional key makes it
    // required in the parsed output, so the spread onto the existing team writes `undefined`.
    test("should not clear `description` on an update that omits it", async () => {
        const [createResponse] = await securityTeam.create({ data: mocks.teamA });
        const team = createResponse.data.security.createTeam.data;

        const [updateResponse] = await securityTeam.update({
            id: team.id,
            data: { name: "Team-A renamed" }
        });

        expect(updateResponse.data.security.updateTeam).toMatchObject({
            data: {
                name: "Team-A renamed",
                description: mocks.teamA.description
            },
            error: null
        });
    });

    // The read path for rows written before `description` was normalised. Those still hold null in
    // storage, and `SecurityTeam.description` is declared `String` (nullable), so GraphQL has to
    // return the null rather than error on it - which is what lets the admin app coalesce it to "".
    test("should return a null `description` stored before normalisation", async () => {
        const [createResponse] = await securityTeam.create({ data: mocks.teamA });
        const team = createResponse.data.security.createTeam.data;

        // Write null straight through storage, bypassing the use case that would coalesce it.
        const { securityStorageOperations } =
            getStorageOps<ApiCoreStorageOperations>("apiCore").storageOperations;

        const stored = await securityStorageOperations.getTeam({
            where: { id: team.id, tenant: "root" }
        });

        await securityStorageOperations.updateTeam({
            original: stored as any,
            team: { ...(stored as any), description: null }
        });

        const [getResponse] = await securityTeam.get({ id: team.id });

        // `id` is not in this query's selection set - `description` is, which is the point.
        expect(getResponse.data.security.getTeam).toMatchObject({
            data: { name: "Team-A", description: null },
            error: null
        });

        // A GraphQL-level rejection would surface here instead of in the payload.
        expect(getResponse.errors).toBeUndefined();
    });

    test('should not allow creating a team with same "slug"', async () => {
        // Creating a team
        await securityTeam.create({ data: mocks.teamA });

        // Creating a team with same "slug" should not be allowed
        const [response] = await securityTeam.create({ data: mocks.teamA });

        expect(response).toEqual({
            data: {
                security: {
                    createTeam: {
                        data: null,
                        error: {
                            code: "TEAM_EXISTS",
                            message: `Team with slug "${mocks.teamA.slug}" already exists.`,
                            data: {
                                slug: "team-a"
                            }
                        }
                    }
                }
            }
        });
    });

    test("should not allow update of a team created via a plugin", async () => {
        // Creating a team with same "slug" should not be allowed
        const [response] = await securityTeam.update({
            id: "test-team-1",
            data: {
                name: "Test Team 1 - updated"
            }
        });

        expect(response).toEqual({
            data: {
                security: {
                    updateTeam: {
                        data: null,
                        error: {
                            code: "CANNOT_UPDATE_PLUGIN_TEAMS",
                            data: null,
                            message: "Cannot update teams created via plugins."
                        }
                    }
                }
            }
        });
    });

    test("should not allow deletion of a team created via a plugin", async () => {
        // Creating a team with same "slug" should not be allowed
        const [response] = await securityTeam.delete({ id: "test-team-2" });

        expect(response).toEqual({
            data: {
                security: {
                    deleteTeam: {
                        data: null,
                        error: {
                            code: "CANNOT_DELETE_PLUGIN_TEAMS",
                            data: null,
                            message: "Cannot delete teams created via plugins."
                        }
                    }
                }
            }
        });
    });
});
