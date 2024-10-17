import useGqlHandler from "./useGqlHandler";
import mocks from "./mocks/securityTeam";
import { createSecurityRolePlugin } from "~/plugins/SecurityRolePlugin";
import { createSecurityTeamPlugin } from "~/plugins/SecurityTeamPlugin";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense";

describe("Security Team CRUD Test", () => {
    const { install, securityTeam } = useGqlHandler({
        wcpLicense: createTestWcpLicense(),
        plugins: [
            createSecurityRolePlugin({
                id: "test-team-1",
                name: "Test Team 1",
                description: "1st test team defined via an extension.",
                permissions: [{ name: "cms.*" }]
            }),
            createSecurityRolePlugin({
                id: "test-team-2",
                name: "Test Team 2",
                description: "2nd test team defined via an extension.",
                permissions: [{ name: "pb.*" }]
            }),
            createSecurityTeamPlugin({
                id: "test-team-2",
                name: "Test Team 2",
                description: "2nd test team defined via an extension.",
                roles: ["test-team-1"]
            }),
            createSecurityTeamPlugin({
                id: "test-team-1",
                name: "Test Team 1",
                description: "1st test team defined via an extension.",
                roles: ["test-team-2"]
            })
        ]
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
                    groups: [
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
                    groups: [
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
                    groups: []
                },
                {
                    name: "Team-B",
                    description: "B: Dolor odit et quia animi ipsum nostrum nesciunt.",
                    slug: "team-b",
                    groups: []
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
                            code: "NOT_FOUND",
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
                            data: null
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
        const [response] = await securityTeam.delete({ id: "" });

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
