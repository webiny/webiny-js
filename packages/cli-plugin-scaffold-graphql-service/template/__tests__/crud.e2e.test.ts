import { GET_TARGET, CREATE_TARGET, DELETE_TARGET, LIST_TARGETS, UPDATE_TARGET } from "./graphql/targets";
import { request } from "graphql-request";

/**
 * An example of an end-to-end (E2E) test. You can use these to test if the overall cloud infrastructure
 * setup is working. That's why, here we're not executing the handler code directly, but over the
 * deployed Amazon Cloudfront distribution. These provide the highest level of confidence that our
 * application is working, but they take more time in order to complete.
 * https://www.webiny.com/docs/tutorials
 */

const query = async ({ query = "", variables = {} } = {}) => {
    return request(process.env.API_URL + "/graphql", query, variables).catch(() => {});
};

let testTargets = [];

describe("Targets CRUD tests (end-to-end)", () => {
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
                    id: testTargets[i].targets.createTarget.id
                }
            });
        }
        testTargets = [];
    });

    it("should be able to perform basic CRUD operations", async () => {
        // 1. Now that we have targets created, let's see if they come up in a basic listTargets query.
        const [target0, target1, target2] = testTargets;

        const targetsListResponse = await query({ query: LIST_TARGETS, variables: { limit: 3 } });

        expect(targetsListResponse).toEqual({
            targets: {
                listTargets: {
                    data: [
                        {
                            id: target2.targets.createTarget.id,
                            title: `Target 2`,
                            description: `Target 2's description.`
                        },
                        {
                            id: target1.targets.createTarget.id,
                            title: `Target 1`,
                            description: `Target 1's description.`
                        },
                        {
                            id: target0.targets.createTarget.id,
                            title: `Target 0`,
                            description: `Target 0's description.`
                        }
                    ],
                    meta: {
                        cursor: target0.targets.createTarget.id,
                        limit: 3
                    }
                }
            }
        });

        // 2. Delete target 1.
        await query({
            query: DELETE_TARGET,
            variables: {
                id: target1.targets.createTarget.id
            }
        });

        const targetsListAfterDeleteResponse = await query({
            query: LIST_TARGETS,
            variables: {
                limit: 2
            }
        });

        expect(targetsListAfterDeleteResponse).toEqual({
            targets: {
                listTargets: {
                    data: [
                        {
                            id: target2.targets.createTarget.id,
                            title: `Target 2`,
                            description: `Target 2's description.`
                        },
                        {
                            id: target0.targets.createTarget.id,
                            title: `Target 0`,
                            description: `Target 0's description.`
                        }
                    ],
                    meta: {
                        cursor: target0.targets.createTarget.id,
                        limit: 2
                    }
                }
            }
        });

        // 3. Update target 0.
        const updateResponse = await query({
            query: UPDATE_TARGET,
            variables: {
                id: target0.targets.createTarget.id,
                data: {
                    title: "Target 0 - UPDATED",
                    description: `Target 0's description - UPDATED.`
                }
            }
        });

        expect(updateResponse).toEqual({
            targets: {
                updateTarget: {
                    id: target0.targets.createTarget.id,
                    title: "Target 0 - UPDATED",
                    description: `Target 0's description - UPDATED.`
                }
            }
        });

        // 5. Get target 0 after the update.
        const getResponse = await query({
            query: GET_TARGET,
            variables: {
                id: target0.targets.createTarget.id
            }
        });

        expect(getResponse).toEqual({
            targets: {
                getTarget: {
                    id: target0.targets.createTarget.id,
                    title: "Target 0 - UPDATED",
                    description: `Target 0's description - UPDATED.`
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
            targets: {
                listTargets: {
                    data: [
                        {
                            id: target2.targets.createTarget.id,
                            title: `Target 2`,
                            description: `Target 2's description.`
                        },
                        {
                            id: target1.targets.createTarget.id,
                            title: `Target 1`,
                            description: `Target 1's description.`
                        }
                    ],
                    meta: {
                        cursor: target1.targets.createTarget.id,
                        limit: 2
                    }
                }
            }
        });

        const targetsListDescPage2Response = await query({
            query: LIST_TARGETS,
            variables: {
                limit: 1,
                after: targetsListDescPage1Response.targets.listTargets.meta.cursor
            }
        });

        expect(targetsListDescPage2Response).toEqual({
            targets: {
                listTargets: {
                    data: [
                        {
                            id: target0.targets.createTarget.id,
                            title: `Target 0`,
                            description: `Target 0's description.`
                        }
                    ],
                    meta: {
                        cursor: target0.targets.createTarget.id,
                        limit: 1
                    }
                }
            }
        });
    });
});
