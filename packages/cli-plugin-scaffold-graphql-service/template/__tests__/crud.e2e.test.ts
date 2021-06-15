import {
    GET_BOOK,
    CREATE_BOOK,
    DELETE_BOOK,
    LIST_BOOKS,
    UPDATE_BOOK
} from "./graphql/targetDataModels";
import { request } from "graphql-request";

/**
 * An example of an end-to-end (E2E) test. You can use these to test if the overall cloud infrastructure
 * setup is working. That's why, here we're not executing the handler code directly, but issuing real
 * HTTP requests over to the deployed Amazon Cloudfront distribution. These tests provide the highest
 * level of confidence that our application is working, but they take more time in order to complete.
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
                    query: CREATE_BOOK,
                    variables: {
                        data: {
                            title: `TargetDataModel ${i}`,
                            description: `TargetDataModel ${i}'s description.`
                        }
                    }
                }).then(response => response.targetDataModels.createTargetDataModel)
            );
        }
    });

    afterEach(async () => {
        for (let i = 0; i < 3; i++) {
            await query({
                query: DELETE_BOOK,
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

        await query({
            query: LIST_BOOKS,
            variables: { limit: 3 }
        }).then(response =>
            expect(response.targetDataModels.listTargetDataModels).toMatchObject({
                data: [targetDataModel2, targetDataModel1, targetDataModel0],
                meta: {
                    limit: 3
                }
            })
        );

        // 2. Delete targetDataModel 1.
        await query({
            query: DELETE_BOOK,
            variables: {
                id: targetDataModel1.id
            }
        });

        await query({
            query: LIST_BOOKS,
            variables: {
                limit: 2
            }
        }).then(response =>
            expect(response.targetDataModels.listTargetDataModels).toMatchObject({
                data: [targetDataModel2, targetDataModel0],
                meta: {
                    limit: 2
                }
            })
        );

        // 3. Update targetDataModel 0.
        await query({
            query: UPDATE_BOOK,
            variables: {
                id: targetDataModel0.id,
                data: {
                    title: "TargetDataModel 0 - UPDATED",
                    description: `TargetDataModel 0's description - UPDATED.`
                }
            }
        }).then(response =>
            expect(response.targetDataModels.updateTargetDataModel).toEqual({
                id: targetDataModel0.id,
                title: "TargetDataModel 0 - UPDATED",
                description: `TargetDataModel 0's description - UPDATED.`
            })
        );

        // 4. Get targetDataModel 0 after the update.
        await query({
            query: GET_BOOK,
            variables: {
                id: targetDataModel0.id
            }
        }).then(response =>
            expect(response.targetDataModels.getTargetDataModel).toEqual({
                id: targetDataModel0.id,
                title: "TargetDataModel 0 - UPDATED",
                description: `TargetDataModel 0's description - UPDATED.`
            })
        );
    });
});
