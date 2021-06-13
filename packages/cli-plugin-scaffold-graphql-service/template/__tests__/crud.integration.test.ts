import { handler } from "~/index";
import {
    GET_TARGET_DATA_MODEL,
    CREATE_TARGET_DATA_MODEL,
    DELETE_TARGET_DATA_MODEL,
    LIST_TARGET_DATA_MODELS,
    UPDATE_TARGET_DATA_MODEL
} from "./graphql/targetDataModels";

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

let testTargetDataModels = [];

describe("TargetDataModels CRUD tests (integration)", () => {
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
                    id: testTargetDataModels[i].data.targetDataModels.createTargetDataModel.id
                }
            });
        }
        testTargetDataModels = [];
    });

    it("should be able to perform basic CRUD operations", async () => {
        // 1. Now that we have targetDataModels created, let's see if they come up in a basic listTargetDataModels query.
        const [targetDataModel0, targetDataModel1, targetDataModel2] = testTargetDataModels;

        const targetDataModelsListResponse = await query({ query: LIST_TARGET_DATA_MODELS });

        expect(targetDataModelsListResponse).toEqual({
            data: {
                targetDataModels: {
                    listTargetDataModels: {
                        data: [
                            {
                                id: targetDataModel2.data.targetDataModels.createTargetDataModel.id,
                                title: `TargetDataModel 2`,
                                description: `TargetDataModel 2's description.`
                            },
                            {
                                id: targetDataModel1.data.targetDataModels.createTargetDataModel.id,
                                title: `TargetDataModel 1`,
                                description: `TargetDataModel 1's description.`
                            },
                            {
                                id: targetDataModel0.data.targetDataModels.createTargetDataModel.id,
                                title: `TargetDataModel 0`,
                                description: `TargetDataModel 0's description.`
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

        // 2. Delete targetDataModel 1.
        await query({
            query: DELETE_TARGET_DATA_MODEL,
            variables: {
                id: targetDataModel1.data.targetDataModels.createTargetDataModel.id
            }
        });

        const targetDataModelsListAfterDeleteResponse = await query({
            query: LIST_TARGET_DATA_MODELS
        });

        expect(targetDataModelsListAfterDeleteResponse).toEqual({
            data: {
                targetDataModels: {
                    listTargetDataModels: {
                        data: [
                            {
                                id: targetDataModel2.data.targetDataModels.createTargetDataModel.id,
                                title: `TargetDataModel 2`,
                                description: `TargetDataModel 2's description.`
                            },
                            {
                                id: targetDataModel0.data.targetDataModels.createTargetDataModel.id,
                                title: `TargetDataModel 0`,
                                description: `TargetDataModel 0's description.`
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

        // 3. Update targetDataModel 0.
        const updateResponse = await query({
            query: UPDATE_TARGET_DATA_MODEL,
            variables: {
                id: targetDataModel0.data.targetDataModels.createTargetDataModel.id,
                data: {
                    title: "TargetDataModel 0 - UPDATED",
                    description: `TargetDataModel 0's description - UPDATED.`
                }
            }
        });

        expect(updateResponse).toEqual({
            data: {
                targetDataModels: {
                    updateTargetDataModel: {
                        id: targetDataModel0.data.targetDataModels.createTargetDataModel.id,
                        title: "TargetDataModel 0 - UPDATED",
                        description: `TargetDataModel 0's description - UPDATED.`
                    }
                }
            }
        });

        // 5. Get targetDataModel 0 after the update.
        const getResponse = await query({
            query: GET_TARGET_DATA_MODEL,
            variables: {
                id: targetDataModel0.data.targetDataModels.createTargetDataModel.id
            }
        });

        expect(getResponse).toEqual({
            data: {
                targetDataModels: {
                    getTargetDataModel: {
                        id: targetDataModel0.data.targetDataModels.createTargetDataModel.id,
                        title: "TargetDataModel 0 - UPDATED",
                        description: `TargetDataModel 0's description - UPDATED.`
                    }
                }
            }
        });
    });

    test("should be able to sort targetDataModels", async () => {
        const [targetDataModel0, targetDataModel1, targetDataModel2] = testTargetDataModels;

        const targetDataModelsListDescResponse = await query({
            query: LIST_TARGET_DATA_MODELS,
            variables: {
                sort: "createdOn_DESC"
            }
        });

        expect(targetDataModelsListDescResponse).toEqual({
            data: {
                targetDataModels: {
                    listTargetDataModels: {
                        data: [
                            {
                                id: targetDataModel2.data.targetDataModels.createTargetDataModel.id,
                                title: `TargetDataModel 2`,
                                description: `TargetDataModel 2's description.`
                            },
                            {
                                id: targetDataModel1.data.targetDataModels.createTargetDataModel.id,
                                title: `TargetDataModel 1`,
                                description: `TargetDataModel 1's description.`
                            },
                            {
                                id: targetDataModel0.data.targetDataModels.createTargetDataModel.id,
                                title: `TargetDataModel 0`,
                                description: `TargetDataModel 0's description.`
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

        const targetDataModelsListAscResponse = await query({
            query: LIST_TARGET_DATA_MODELS,
            variables: {
                sort: "createdOn_ASC"
            }
        });

        expect(targetDataModelsListAscResponse).toEqual({
            data: {
                targetDataModels: {
                    listTargetDataModels: {
                        data: [
                            {
                                id: targetDataModel0.data.targetDataModels.createTargetDataModel.id,
                                title: `TargetDataModel 0`,
                                description: `TargetDataModel 0's description.`
                            },
                            {
                                id: targetDataModel1.data.targetDataModels.createTargetDataModel.id,
                                title: `TargetDataModel 1`,
                                description: `TargetDataModel 1's description.`
                            },
                            {
                                id: targetDataModel2.data.targetDataModels.createTargetDataModel.id,
                                title: `TargetDataModel 2`,
                                description: `TargetDataModel 2's description.`
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
        const [targetDataModel0, targetDataModel1, targetDataModel2] = testTargetDataModels;

        const targetDataModelsListDescPage1Response = await query({
            query: LIST_TARGET_DATA_MODELS,
            variables: {
                limit: 2
            }
        });

        expect(targetDataModelsListDescPage1Response).toEqual({
            data: {
                targetDataModels: {
                    listTargetDataModels: {
                        data: [
                            {
                                id: targetDataModel2.data.targetDataModels.createTargetDataModel.id,
                                title: `TargetDataModel 2`,
                                description: `TargetDataModel 2's description.`
                            },
                            {
                                id: targetDataModel1.data.targetDataModels.createTargetDataModel.id,
                                title: `TargetDataModel 1`,
                                description: `TargetDataModel 1's description.`
                            }
                        ],
                        meta: {
                            cursor: targetDataModel1.data.targetDataModels.createTargetDataModel.id,
                            limit: 2
                        }
                    }
                }
            }
        });

        const targetDataModelsListDescPage2Response = await query({
            query: LIST_TARGET_DATA_MODELS,
            variables: {
                limit: 2,
                after:
                    targetDataModelsListDescPage1Response.data.targetDataModels.listTargetDataModels
                        .meta.cursor
            }
        });

        expect(targetDataModelsListDescPage2Response).toEqual({
            data: {
                targetDataModels: {
                    listTargetDataModels: {
                        data: [
                            {
                                id: targetDataModel0.data.targetDataModels.createTargetDataModel.id,
                                title: `TargetDataModel 0`,
                                description: `TargetDataModel 0's description.`
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

        const targetDataModelsListAscPage1Response = await query({
            query: LIST_TARGET_DATA_MODELS,
            variables: {
                limit: 2,
                sort: "createdOn_ASC"
            }
        });

        expect(targetDataModelsListAscPage1Response).toMatchObject({
            data: {
                targetDataModels: {
                    listTargetDataModels: {
                        data: [
                            {
                                id: targetDataModel0.data.targetDataModels.createTargetDataModel.id,
                                title: `TargetDataModel 0`,
                                description: `TargetDataModel 0's description.`
                            },
                            {
                                id: targetDataModel1.data.targetDataModels.createTargetDataModel.id,
                                title: `TargetDataModel 1`,
                                description: `TargetDataModel 1's description.`
                            }
                        ],
                        meta: {
                            cursor: targetDataModel1.data.targetDataModels.createTargetDataModel.id,
                            limit: 2
                        }
                    }
                }
            }
        });

        const targetDataModelsListAscPage2Response = await query({
            query: LIST_TARGET_DATA_MODELS,
            variables: {
                limit: 2,
                sort: "createdOn_ASC",
                after:
                    targetDataModelsListAscPage1Response.data.targetDataModels.listTargetDataModels
                        .meta.cursor
            }
        });

        expect(targetDataModelsListAscPage2Response).toEqual({
            data: {
                targetDataModels: {
                    listTargetDataModels: {
                        data: [
                            {
                                id: targetDataModel2.data.targetDataModels.createTargetDataModel.id,
                                title: `TargetDataModel 2`,
                                description: `TargetDataModel 2's description.`
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
