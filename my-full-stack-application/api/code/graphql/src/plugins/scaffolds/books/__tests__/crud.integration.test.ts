import { handler } from "~/index";
import { GET_BOOK, CREATE_BOOK, DELETE_BOOK, LIST_BOOKS, UPDATE_BOOK } from "./graphql/books";

/**
 * An example of an integration test. You can use these to test your GraphQL resolvers, for example,
 * ensure they are correctly interacting with the database and other cloud infrastructure resources
 * and services. These tests provide a good level of confidence that our application is working, and
 * can be reasonably fast to complete.
 * https://www.webiny.com/docs/how-to-guides/webiny-cli/scaffolding/extend-graphql-api#crudintegrationtestts
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

let testBooks = [];

describe("Books CRUD tests (integration)", () => {
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
                }).then(response => response.data.books.createBook)
            );
        }
    });

    afterEach(async () => {
        for (let i = 0; i < 3; i++) {
            await query({
                query: DELETE_BOOK,
                variables: {
                    id: testBooks[i].id
                }
            });
        }
        testBooks = [];
    });

    it("should be able to perform basic CRUD operations", async () => {
        // 1. Now that we have books created, let's see if they come up in a basic listBooks query.
        const [book0, book1, book2] = testBooks;

        await query({ query: LIST_BOOKS }).then(response =>
            expect(response.data.books.listBooks).toEqual({
                data: [book2, book1, book0],
                meta: {
                    after: null,
                    before: null,
                    limit: 10
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
            query: LIST_BOOKS
        }).then(response =>
            expect(response.data.books.listBooks).toEqual({
                data: [book2, book0],
                meta: {
                    after: null,
                    before: null,
                    limit: 10
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
            expect(response.data.books.updateBook).toEqual({
                id: book0.id,
                title: "Book 0 - UPDATED",
                description: `Book 0's description - UPDATED.`
            })
        );

        // 5. Get book 0 after the update.
        await query({
            query: GET_BOOK,
            variables: { id: book0.id }
        }).then(response =>
            expect(response.data.books.getBook).toEqual({
                id: book0.id,
                title: "Book 0 - UPDATED",
                description: `Book 0's description - UPDATED.`
            })
        );
    });

    test("should be able to use cursor-based pagination (desc)", async () => {
        const [book0, book1, book2] = testBooks;

        await query({
            query: LIST_BOOKS,
            variables: {
                limit: 2
            }
        }).then(response =>
            expect(response.data.books.listBooks).toEqual({
                data: [book2, book1],
                meta: {
                    after: book1.id,
                    before: null,
                    limit: 2
                }
            })
        );

        await query({
            query: LIST_BOOKS,
            variables: {
                limit: 2,
                after: book1.id
            }
        }).then(response =>
            expect(response.data.books.listBooks).toEqual({
                data: [book0],
                meta: {
                    before: book0.id,
                    after: null,
                    limit: 2
                }
            })
        );

        await query({
            query: LIST_BOOKS,
            variables: {
                limit: 2,
                before: book0.id
            }
        }).then(response =>
            expect(response.data.books.listBooks).toEqual({
                data: [book2, book1],
                meta: {
                    after: book1.id,
                    before: null,
                    limit: 2
                }
            })
        );
    });

    test("should be able to use cursor-based pagination (ascending)", async () => {
        const [book0, book1, book2] = testBooks;

        await query({
            query: LIST_BOOKS,
            variables: {
                limit: 2,
                sort: "createdOn_ASC"
            }
        }).then(response =>
            expect(response.data.books.listBooks).toEqual({
                data: [book0, book1],
                meta: {
                    after: book1.id,
                    before: null,
                    limit: 2
                }
            })
        );

        await query({
            query: LIST_BOOKS,
            variables: {
                limit: 2,
                sort: "createdOn_ASC",
                after: book1.id
            }
        }).then(response =>
            expect(response.data.books.listBooks).toEqual({
                data: [book2],
                meta: {
                    before: book2.id,
                    after: null,
                    limit: 2
                }
            })
        );

        await query({
            query: LIST_BOOKS,
            variables: {
                limit: 2,
                sort: "createdOn_ASC",
                before: book2.id
            }
        }).then(response =>
            expect(response.data.books.listBooks).toEqual({
                data: [book0, book1],
                meta: {
                    after: book1.id,
                    before: null,
                    limit: 2
                }
            })
        );
    });
});
