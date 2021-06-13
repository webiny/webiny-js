import {
    GET_TARGET_DATA_MODEL,
    CREATE_TARGET_DATA_MODEL,
    DELETE_TARGET_DATA_MODEL,
    LIST_TARGET_DATA_MODELS,
    UPDATE_TARGET_DATA_MODEL
} from "./graphql/targetDataModels";
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

let testTargetDataModels = [];

describe("TargetDataModels CRUD tests (end-to-end)", () => {
    beforeEach(async () => {
        for (let i = 0; i < 3; i++) {
            testTargetDataModels.push(
                await query({
                    query: CREATE_TARGET_DATA_MODEL,
                    variables: {
                        data: {
                            title: `TargetDataModel ${i}`,
                            description: `TargetDataModel ${i}'s description.`
                        }
                    }
                })
            );
        }
    });

    afterEach(async () => {
        for (let i = 0; i < 3; i++) {
            await query({
                query: DELETE_TARGET_DATA_MODEL,
                variables: {
                    id: testTargetDataModels[i].targetDataModels.createTargetDataModel.id
                }
            });
        }
        testTargetDataModels = [];
    });

    it("should be able to perform basic CRUD operations", async () => {
        // 1. Now that we have targetDataModels created, let's see if they come up in a basic listTargetDataModels query.
        const [targetDataModel0, targetDataModel1, targetDataModel2] = testTargetDataModels;

        const targetDataModelsListResponse = await query({
            query: LIST_TARGET_DATA_MODELS,
            variables: { limit: 3 }
        });

        expect(targetDataModelsListResponse).toEqual({
            targetDataModels: {
                listTargetDataModels: {
                    data: [
                        {
                            id: targetDataModel2.targetDataModels.createTargetDataModel.id,
                            title: `TargetDataModel 2`,
                            description: `TargetDataModel 2's description.`
                        },
                        {
                            id: targetDataModel1.targetDataModels.createTargetDataModel.id,
                            title: `TargetDataModel 1`,
                            description: `TargetDataModel 1's description.`
                        },
                        {
                            id: targetDataModel0.targetDataModels.createTargetDataModel.id,
                            title: `TargetDataModel 0`,
                            description: `TargetDataModel 0's description.`
                        }
                    ],
                    meta: {
                        cursor: targetDataModel0.targetDataModels.createTargetDataModel.id,
                        limit: 3
                    }
                }
            }
        });

        // 2. Delete targetDataModel 1.
        await query({
            query: DELETE_TARGET_DATA_MODEL,
            variables: {
                id: targetDataModel1.targetDataModels.createTargetDataModel.id
            }
        });

        const targetDataModelsListAfterDeleteResponse = await query({
            query: LIST_TARGET_DATA_MODELS,
            variables: {
                limit: 2
            }
        });

        expect(targetDataModelsListAfterDeleteResponse).toEqual({
            targetDataModels: {
                listTargetDataModels: {
                    data: [
                        {
                            id: targetDataModel2.targetDataModels.createTargetDataModel.id,
                            title: `TargetDataModel 2`,
                            description: `TargetDataModel 2's description.`
                        },
                        {
                            id: targetDataModel0.targetDataModels.createTargetDataModel.id,
                            title: `TargetDataModel 0`,
                            description: `TargetDataModel 0's description.`
                        }
                    ],
                    meta: {
                        cursor: targetDataModel0.targetDataModels.createTargetDataModel.id,
                        limit: 2
                    }
                }
            }
        });

        // 3. Update targetDataModel 0.
        const updateResponse = await query({
            query: UPDATE_TARGET_DATA_MODEL,
            variables: {
                id: targetDataModel0.targetDataModels.createTargetDataModel.id,
                data: {
                    title: "TargetDataModel 0 - UPDATED",
                    description: `TargetDataModel 0's description - UPDATED.`
                }
            }
        });

        expect(updateResponse).toEqual({
            targetDataModels: {
                updateTargetDataModel: {
                    id: targetDataModel0.targetDataModels.createTargetDataModel.id,
                    title: "TargetDataModel 0 - UPDATED",
                    description: `TargetDataModel 0's description - UPDATED.`
                }
            }
        });

        // 5. Get targetDataModel 0 after the update.
        const getResponse = await query({
            query: GET_TARGET_DATA_MODEL,
            variables: {
                id: targetDataModel0.targetDataModels.createTargetDataModel.id
            }
        });

        expect(getResponse).toEqual({
            targetDataModels: {
                getTargetDataModel: {
                    id: targetDataModel0.targetDataModels.createTargetDataModel.id,
                    title: "TargetDataModel 0 - UPDATED",
                    description: `TargetDataModel 0's description - UPDATED.`
                }
            }
        });
    });

    test("should be able to use cursor-based pagination", async () => {
        const [targetDataModel0, targetDataModel1, targetDataModel2] = testTargetDataModels;

        const targetDataModelsListDescPage1Response = await query({
            query: LIST_TARGET_DATA_MODELS,
            variables: {
                limit: 2
            }
        });

        expect(targetDataModelsListDescPage1Response).toEqual({
            targetDataModels: {
                listTargetDataModels: {
                    data: [
                        {
                            id: targetDataModel2.targetDataModels.createTargetDataModel.id,
                            title: `TargetDataModel 2`,
                            description: `TargetDataModel 2's description.`
                        },
                        {
                            id: targetDataModel1.targetDataModels.createTargetDataModel.id,
                            title: `TargetDataModel 1`,
                            description: `TargetDataModel 1's description.`
                        }
                    ],
                    meta: {
                        cursor: targetDataModel1.targetDataModels.createTargetDataModel.id,
                        limit: 2
                    }
                }
            }
        });

        const targetDataModelsListDescPage2Response = await query({
            query: LIST_TARGET_DATA_MODELS,
            variables: {
                limit: 1,
                after:
                    targetDataModelsListDescPage1Response.targetDataModels.listTargetDataModels.meta
                        .cursor
            }
        });

        expect(targetDataModelsListDescPage2Response).toEqual({
            targetDataModels: {
                listTargetDataModels: {
                    data: [
                        {
                            id: targetDataModel0.targetDataModels.createTargetDataModel.id,
                            title: `TargetDataModel 0`,
                            description: `TargetDataModel 0's description.`
                        }
                    ],
                    meta: {
                        cursor: targetDataModel0.targetDataModels.createTargetDataModel.id,
                        limit: 1
                    }
                }
            }
        });
    });
});
