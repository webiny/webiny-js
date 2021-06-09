import { handler } from "~";
import { GET_TARGET, CREATE_TARGET, DELETE_TARGET, LIST_TARGETS, UPDATE_TARGET } from "./graphql/targets";

/**
 * An example of an integration test. You can use these to test your GraphQL resolvers, for example,
 * ensure they are correctly interacting with the database and other cloud infrastructure resources
 * and services. These tests provide a good level of confidence that our application is working, and
 * can be reasonably fast to complete.
 * https://www.webiny.com/docs/tutorials
 */

const query = ({ query = "", variables = {} } = {}) => {
    return handler({
        httpMethod: "POST",
        headers: {},
        body: JSON.stringify({
            query,
            variables
        })
    }).then(response => JSON.parse(response.body));
};

let testTargets = [];

describe("Targets CRUD tests (integration)", () => {
    beforeEach(async () => {
        for (let i = 0; i < 3; i++) {
            testTargets.push(
                await query({
                    query: CREATE_TARGET,
                    variables: {
                        data: {
                            title: `Target ${i}`,
                            description: `Target ${i}'s description.`
                        }
                    }
                })
            );
        }
    });

    afterEach(async () => {
        for (let i = 0; i < 3; i++) {
            await query({
                query: DELETE_TARGET,
                variables: {
                    id: testTargets[i].data.targets.createTarget.id
                }
            });
        }
        testTargets = [];
    });

    it("should be able to perform basic CRUD operations", async () => {
        // 1. Now that we have targets created, let's see if they come up in a basic listTargets query.
        const [target0, target1, target2] = testTargets;

        const targetsListResponse = await query({ query: LIST_TARGETS });

        expect(targetsListResponse).toEqual({
            data: {
                targets: {
                    listTargets: {
                        data: [
                            {
                                id: target2.data.targets.createTarget.id,
                                title: `Target 2`,
                                description: `Target 2's description.`
                            },
                            {
                                id: target1.data.targets.createTarget.id,
                                title: `Target 1`,
                                description: `Target 1's description.`
                            },
                            {
                                id: target0.data.targets.createTarget.id,
                                title: `Target 0`,
                                description: `Target 0's description.`
                            }
                        ],
                        meta: {
                            cursor: null,
                            limit: 10
                        }
                    }
                }
            }
        });

        // 2. Delete target 1.
        await query({
            query: DELETE_TARGET,
            variables: {
                id: target1.data.targets.createTarget.id
            }
        });

        const targetsListAfterDeleteResponse = await query({
            query: LIST_TARGETS
        });

        expect(targetsListAfterDeleteResponse).toEqual({
            data: {
                targets: {
                    listTargets: {
                        data: [
                            {
                                id: target2.data.targets.createTarget.id,
                                title: `Target 2`,
                                description: `Target 2's description.`
                            },
                            {
                                id: target0.data.targets.createTarget.id,
                                title: `Target 0`,
                                description: `Target 0's description.`
                            }
                        ],
                        meta: {
                            cursor: null,
                            limit: 10
                        }
                    }
                }
            }
        });

        // 3. Update target 0.
        const updateResponse = await query({
            query: UPDATE_TARGET,
            variables: {
                id: target0.data.targets.createTarget.id,
                data: {
                    title: "Target 0 - UPDATED",
                    description: `Target 0's description - UPDATED.`
                }
            }
        });

        expect(updateResponse).toEqual({
            data: {
                targets: {
                    updateTarget: {
                        id: target0.data.targets.createTarget.id,
                        title: "Target 0 - UPDATED",
                        description: `Target 0's description - UPDATED.`
                    }
                }
            }
        });

        // 5. Get target 0 after the update.
        const getResponse = await query({
            query: GET_TARGET,
            variables: {
                id: target0.data.targets.createTarget.id
            }
        });

        expect(getResponse).toEqual({
            data: {
                targets: {
                    getTarget: {
                        id: target0.data.targets.createTarget.id,
                        title: "Target 0 - UPDATED",
                        description: `Target 0's description - UPDATED.`
                    }
                }
            }
        });
    });

    test("should be able to sort targets", async () => {
        const [target0, target1, target2] = testTargets;

        const targetsListDescResponse = await query({
            query: LIST_TARGETS,
            variables: {
                sort: { savedOn: "desc" }
            }
        });

        expect(targetsListDescResponse).toEqual({
            data: {
                targets: {
                    listTargets: {
                        data: [
                            {
                                id: target2.data.targets.createTarget.id,
                                title: `Target 2`,
                                description: `Target 2's description.`
                            },
                            {
                                id: target1.data.targets.createTarget.id,
                                title: `Target 1`,
                                description: `Target 1's description.`
                            },
                            {
                                id: target0.data.targets.createTarget.id,
                                title: `Target 0`,
                                description: `Target 0's description.`
                            }
                        ],
                        meta: {
                            cursor: null,
                            limit: 10
                        }
                    }
                }
            }
        });

        const targetsListAscResponse = await query({
            query: LIST_TARGETS,
            variables: {
                sort: { savedOn: "asc" }
            }
        });

        expect(targetsListAscResponse).toEqual({
            data: {
                targets: {
                    listTargets: {
                        data: [
                            {
                                id: target0.data.targets.createTarget.id,
                                title: `Target 0`,
                                description: `Target 0's description.`
                            },
                            {
                                id: target1.data.targets.createTarget.id,
                                title: `Target 1`,
                                description: `Target 1's description.`
                            },
                            {
                                id: target2.data.targets.createTarget.id,
                                title: `Target 2`,
                                description: `Target 2's description.`
                            }
                        ],
                        meta: {
                            cursor: null,
                            limit: 10
                        }
                    }
                }
            }
        });
    });

    test("should be able to use cursor-based pagination", async () => {
        const [target0, target1, target2] = testTargets;

        const targetsListDescPage1Response = await query({
            query: LIST_TARGETS,
            variables: {
                limit: 2
            }
        });

        expect(targetsListDescPage1Response).toEqual({
            data: {
                targets: {
                    listTargets: {
                        data: [
                            {
                                id: target2.data.targets.createTarget.id,
                                title: `Target 2`,
                                description: `Target 2's description.`
                            },
                            {
                                id: target1.data.targets.createTarget.id,
                                title: `Target 1`,
                                description: `Target 1's description.`
                            }
                        ],
                        meta: {
                            cursor: target1.data.targets.createTarget.id,
                            limit: 2
                        }
                    }
                }
            }
        });

        const targetsListDescPage2Response = await query({
            query: LIST_TARGETS,
            variables: {
                limit: 2,
                after: targetsListDescPage1Response.data.targets.listTargets.meta.cursor
            }
        });

        expect(targetsListDescPage2Response).toEqual({
            data: {
                targets: {
                    listTargets: {
                        data: [
                            {
                                id: target0.data.targets.createTarget.id,
                                title: `Target 0`,
                                description: `Target 0's description.`
                            }
                        ],
                        meta: {
                            cursor: null,
                            limit: 2
                        }
                    }
                }
            }
        });

        const targetsListAscPage1Response = await query({
            query: LIST_TARGETS,
            variables: {
                limit: 2,
                sort: { savedOn: "asc" }
            }
        });

        expect(targetsListAscPage1Response).toMatchObject({
            data: {
                targets: {
                    listTargets: {
                        data: [
                            {
                                id: target0.data.targets.createTarget.id,
                                title: `Target 0`,
                                description: `Target 0's description.`
                            },
                            {
                                id: target1.data.targets.createTarget.id,
                                title: `Target 1`,
                                description: `Target 1's description.`
                            }
                        ],
                        meta: {
                            cursor: target1.data.targets.createTarget.id,
                            limit: 2
                        }
                    }
                }
            }
        });

        const targetsListAscPage2Response = await query({
            query: LIST_TARGETS,
            variables: {
                limit: 2,
                sort: { savedOn: "asc" },
                after: targetsListAscPage1Response.data.targets.listTargets.meta.cursor
            }
        });

        expect(targetsListAscPage2Response).toEqual({
            data: {
                targets: {
                    listTargets: {
                        data: [
                            {
                                id: target2.data.targets.createTarget.id,
                                title: `Target 2`,
                                description: `Target 2's description.`
                            }
                        ],
                        meta: {
                            cursor: null,
                            limit: 2
                        }
                    }
                }
            }
        });
    });
});
