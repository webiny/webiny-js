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
 * https://www.webiny.com/docs/how-to-guides/scaffolding/extend-graphql-api#crudintegrationtestts
 */

const query = ({ query = "", variables = {} } = {}) => {
    return handler({
        httpMethod: "POST",
        headers: {},
        body: JSON.stringify({
            query,
            variables
        })
    }).then((response: any) => JSON.parse(response.body));
};

let testTargetDataModels: any[] = [];

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
                }).then((response: any) => response.data.targetDataModels.createTargetDataModel)
            );
        }
    });

    afterEach(async () => {
        for (let i = 0; i < 3; i++) {
            await query({
                query: DELETE_TARGET_DATA_MODEL,
                variables: {
                    id: testTargetDataModels[i].id
                }
            });
        }
        testTargetDataModels = [];
    });

    it("should be able to perform basic CRUD operations", async () => {
        // 1. Now that we have targetDataModels created, let's see if they come up in a basic listTargetDataModels query.
        const [targetDataModel0, targetDataModel1, targetDataModel2] = testTargetDataModels;

        await query({ query: LIST_TARGET_DATA_MODELS }).then((response: any) =>
            expect(response.data.targetDataModels.listTargetDataModels).toEqual({
                data: [targetDataModel2, targetDataModel1, targetDataModel0],
                meta: {
                    after: null,
                    before: null,
                    limit: 10
                }
            })
        );

        // 2. Delete targetDataModel 1.
        await query({
            query: DELETE_TARGET_DATA_MODEL,
            variables: {
                id: targetDataModel1.id
            }
        });

        await query({
            query: LIST_TARGET_DATA_MODELS
        }).then((response: any) =>
            expect(response.data.targetDataModels.listTargetDataModels).toEqual({
                data: [targetDataModel2, targetDataModel0],
                meta: {
                    after: null,
                    before: null,
                    limit: 10
                }
            })
        );

        // 3. Update targetDataModel 0.
        await query({
            query: UPDATE_TARGET_DATA_MODEL,
            variables: {
                id: targetDataModel0.id,
                data: {
                    title: "TargetDataModel 0 - UPDATED",
                    description: `TargetDataModel 0's description - UPDATED.`
                }
            }
        }).then((response: any) =>
            expect(response.data.targetDataModels.updateTargetDataModel).toEqual({
                id: targetDataModel0.id,
                title: "TargetDataModel 0 - UPDATED",
                description: `TargetDataModel 0's description - UPDATED.`
            })
        );

        // 5. Get targetDataModel 0 after the update.
        await query({
            query: GET_TARGET_DATA_MODEL,
            variables: { id: targetDataModel0.id }
        }).then((response: any) =>
            expect(response.data.targetDataModels.getTargetDataModel).toEqual({
                id: targetDataModel0.id,
                title: "TargetDataModel 0 - UPDATED",
                description: `TargetDataModel 0's description - UPDATED.`
            })
        );
    });

    test("should be able to use cursor-based pagination (desc)", async () => {
        const [targetDataModel0, targetDataModel1, targetDataModel2] = testTargetDataModels;

        await query({
            query: LIST_TARGET_DATA_MODELS,
            variables: {
                limit: 2
            }
        }).then((response: any) =>
            expect(response.data.targetDataModels.listTargetDataModels).toEqual({
                data: [targetDataModel2, targetDataModel1],
                meta: {
                    after: targetDataModel1.id,
                    before: null,
                    limit: 2
                }
            })
        );

        await query({
            query: LIST_TARGET_DATA_MODELS,
            variables: {
                limit: 2,
                after: targetDataModel1.id
            }
        }).then((response: any) =>
            expect(response.data.targetDataModels.listTargetDataModels).toEqual({
                data: [targetDataModel0],
                meta: {
                    before: targetDataModel0.id,
                    after: null,
                    limit: 2
                }
            })
        );

        await query({
            query: LIST_TARGET_DATA_MODELS,
            variables: {
                limit: 2,
                before: targetDataModel0.id
            }
        }).then((response: any) =>
            expect(response.data.targetDataModels.listTargetDataModels).toEqual({
                data: [targetDataModel2, targetDataModel1],
                meta: {
                    after: targetDataModel1.id,
                    before: null,
                    limit: 2
                }
            })
        );
    });

    test("should be able to use cursor-based pagination (ascending)", async () => {
        const [targetDataModel0, targetDataModel1, targetDataModel2] = testTargetDataModels;

        await query({
            query: LIST_TARGET_DATA_MODELS,
            variables: {
                limit: 2,
                sort: "createdOn_ASC"
            }
        }).then((response: any) =>
            expect(response.data.targetDataModels.listTargetDataModels).toEqual({
                data: [targetDataModel0, targetDataModel1],
                meta: {
                    after: targetDataModel1.id,
                    before: null,
                    limit: 2
                }
            })
        );

        await query({
            query: LIST_TARGET_DATA_MODELS,
            variables: {
                limit: 2,
                sort: "createdOn_ASC",
                after: targetDataModel1.id
            }
        }).then((response: any) =>
            expect(response.data.targetDataModels.listTargetDataModels).toEqual({
                data: [targetDataModel2],
                meta: {
                    before: targetDataModel2.id,
                    after: null,
                    limit: 2
                }
            })
        );

        await query({
            query: LIST_TARGET_DATA_MODELS,
            variables: {
                limit: 2,
                sort: "createdOn_ASC",
                before: targetDataModel2.id
            }
        }).then((response: any) =>
            expect(response.data.targetDataModels.listTargetDataModels).toEqual({
                data: [targetDataModel0, targetDataModel1],
                meta: {
                    after: targetDataModel1.id,
                    before: null,
                    limit: 2
                }
            })
        );
    });
});
