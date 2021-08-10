import { GET_BOOK, CREATE_BOOK, DELETE_BOOK, LIST_BOOKS, UPDATE_BOOK } from "./graphql/books";
import { request } from "graphql-request";

/**
 * An example of an end-to-end (E2E) test. You can use these to test if the overall cloud infrastructure
 * setup is working. That's why, here we're not executing the handler code directly, but issuing real
 * HTTP requests over to the deployed Amazon Cloudfront distribution. These tests provide the highest
 * level of confidence that our application is working, but they take more time in order to complete.
 * https://www.webiny.com/docs/how-to-guides/webiny-cli/scaffolding/extend-graphql-api#crude2etestts
 */

const query = async ({ query = "", variables = {} } = {}) => {
    return request(process.env.API_URL + "/graphql", query, variables);
};

let testBooks = [];

describe("Books CRUD tests (end-to-end)", () => {
    beforeEach(async () => {
        for (let i = 0; i < 3; i++) {
            testBooks.push(
                await query({
                    query: CREATE_BOOK,
                    variables: {
                        data: {
                            title: `Book ${i}`,
                            description: `Book ${i}'s description.`
                        }
                    }
                }).then(response => response.books.createBook)
            );
        }
    });

    afterEach(async () => {
        for (let i = 0; i < 3; i++) {
            try {
                await query({
                    query: DELETE_BOOK,
                    variables: {
                        id: testBooks[i].id
                    }
                });
            } catch {
                // Some of the entries might've been deleted during runtime.
                // We can ignore thrown errors.
            }
        }
        testBooks = [];
    });

    it("should be able to perform basic CRUD operations", async () => {
        // 1. Now that we have books created, let's see if they come up in a basic listBooks query.
        const [book0, book1, book2] = testBooks;

        await query({
            query: LIST_BOOKS,
            variables: { limit: 3 }
        }).then(response =>
            expect(response.books.listBooks).toMatchObject({
                data: [book2, book1, book0],
                meta: {
                    limit: 3
                }
            })
        );

        // 2. Delete book 1.
        await query({
            query: DELETE_BOOK,
            variables: {
                id: book1.id
            }
        });

        await query({
            query: LIST_BOOKS,
            variables: {
                limit: 2
            }
        }).then(response =>
            expect(response.books.listBooks).toMatchObject({
                data: [book2, book0],
                meta: {
                    limit: 2
                }
            })
        );

        // 3. Update book 0.
        await query({
            query: UPDATE_BOOK,
            variables: {
                id: book0.id,
                data: {
                    title: "Book 0 - UPDATED",
                    description: `Book 0's description - UPDATED.`
                }
            }
        }).then(response =>
            expect(response.books.updateBook).toEqual({
                id: book0.id,
                title: "Book 0 - UPDATED",
                description: `Book 0's description - UPDATED.`
            })
        );

        // 4. Get book 0 after the update.
        await query({
            query: GET_BOOK,
            variables: {
                id: book0.id
            }
        }).then(response =>
            expect(response.books.getBook).toEqual({
                id: book0.id,
                title: "Book 0 - UPDATED",
                description: `Book 0's description - UPDATED.`
            })
        );
    });
});
