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
 * setup is working. That's why, here we're not executing the handler code directly, but issuing real
 * HTTP requests over to the deployed Amazon Cloudfront distribution. These tests provide the highest
 * level of confidence that our application is working, but they take more time in order to complete.
 * https://www.webiny.com/docs/how-to-guides/scaffolding/extend-graphql-api#crude2etestts
 */

const query = async ({ query = "", variables = {} } = {}) => {
    return request(process.env.API_URL + "/graphql", query, variables);
};

let testTargetDataModels: any[] = [];

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
                }).then((response: any) => response.targetDataModels.createTargetDataModel)
            );
        }
    });

    afterEach(async () => {
        for (let i = 0; i < 3; i++) {
            try {
                await query({
                    query: DELETE_TARGET_DATA_MODEL,
                    variables: {
                        id: testTargetDataModels[i].id
                    }
                });
            } catch {
                // Some of the entries might've been deleted during runtime.
                // We can ignore thrown errors.
            }
        }
        testTargetDataModels = [];
    });

    it("should be able to perform basic CRUD operations", async () => {
        // 1. Now that we have targetDataModels created, let's see if they come up in a basic listTargetDataModels query.
        const [targetDataModel0, targetDataModel1, targetDataModel2] = testTargetDataModels;

        await query({
            query: LIST_TARGET_DATA_MODELS,
            variables: { limit: 3 }
        }).then((response: any) =>
            expect(response.targetDataModels.listTargetDataModels).toMatchObject({
                data: [targetDataModel2, targetDataModel1, targetDataModel0],
                meta: {
                    limit: 3
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
            query: LIST_TARGET_DATA_MODELS,
            variables: {
                limit: 2
            }
        }).then((response: any) =>
            expect(response.targetDataModels.listTargetDataModels).toMatchObject({
                data: [targetDataModel2, targetDataModel0],
                meta: {
                    limit: 2
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
            expect(response.targetDataModels.updateTargetDataModel).toEqual({
                id: targetDataModel0.id,
                title: "TargetDataModel 0 - UPDATED",
                description: `TargetDataModel 0's description - UPDATED.`
            })
        );

        // 4. Get targetDataModel 0 after the update.
        await query({
            query: GET_TARGET_DATA_MODEL,
            variables: {
                id: targetDataModel0.id
            }
        }).then((response: any) =>
            expect(response.targetDataModels.getTargetDataModel).toEqual({
                id: targetDataModel0.id,
                title: "TargetDataModel 0 - UPDATED",
                description: `TargetDataModel 0's description - UPDATED.`
            })
        );
    });
});
