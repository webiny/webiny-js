import { GET_BOOK, CREATE_BOOK, DELETE_BOOK, LIST_BOOKS, UPDATE_BOOK } from "./graphql/books";
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
                })
            );
        }
    });

    afterEach(async () => {
        for (let i = 0; i < 3; i++) {
            await query({
                query: DELETE_BOOK,
                variables: {
                    id: testBooks[i].books.createBook.id
                }
            });
        }
        testBooks = [];
    });

    it("should be able to perform basic CRUD operations", async () => {
        // 1. Now that we have books created, let's see if they come up in a basic listBooks query.
        const [targetDataModel0, targetDataModel1, targetDataModel2] = testBooks;

        const booksListResponse = await query({
            query: LIST_BOOKS,
            variables: { limit: 3 }
        });

        expect(booksListResponse).toEqual({
            books: {
                listBooks: {
                    data: [
                        {
                            id: targetDataModel2.books.createBook.id,
                            title: `Book 2`,
                            description: `Book 2's description.`
                        },
                        {
                            id: targetDataModel1.books.createBook.id,
                            title: `Book 1`,
                            description: `Book 1's description.`
                        },
                        {
                            id: targetDataModel0.books.createBook.id,
                            title: `Book 0`,
                            description: `Book 0's description.`
                        }
                    ],
                    meta: {
                        cursor: targetDataModel0.books.createBook.id,
                        limit: 3
                    }
                }
            }
        });

        // 2. Delete targetDataModel 1.
        await query({
            query: DELETE_BOOK,
            variables: {
                id: targetDataModel1.books.createBook.id
            }
        });

        const booksListAfterDeleteResponse = await query({
            query: LIST_BOOKS,
            variables: {
                limit: 2
            }
        });

        expect(booksListAfterDeleteResponse).toEqual({
            books: {
                listBooks: {
                    data: [
                        {
                            id: targetDataModel2.books.createBook.id,
                            title: `Book 2`,
                            description: `Book 2's description.`
                        },
                        {
                            id: targetDataModel0.books.createBook.id,
                            title: `Book 0`,
                            description: `Book 0's description.`
                        }
                    ],
                    meta: {
                        cursor: targetDataModel0.books.createBook.id,
                        limit: 2
                    }
                }
            }
        });

        // 3. Update targetDataModel 0.
        const updateResponse = await query({
            query: UPDATE_BOOK,
            variables: {
                id: targetDataModel0.books.createBook.id,
                data: {
                    title: "Book 0 - UPDATED",
                    description: `Book 0's description - UPDATED.`
                }
            }
        });

        expect(updateResponse).toEqual({
            books: {
                updateBook: {
                    id: targetDataModel0.books.createBook.id,
                    title: "Book 0 - UPDATED",
                    description: `Book 0's description - UPDATED.`
                }
            }
        });

        // 5. Get targetDataModel 0 after the update.
        const getResponse = await query({
            query: GET_BOOK,
            variables: {
                id: targetDataModel0.books.createBook.id
            }
        });

        expect(getResponse).toEqual({
            books: {
                getBook: {
                    id: targetDataModel0.books.createBook.id,
                    title: "Book 0 - UPDATED",
                    description: `Book 0's description - UPDATED.`
                }
            }
        });
    });

    test("should be able to use cursor-based pagination", async () => {
        const [targetDataModel0, targetDataModel1, targetDataModel2] = testBooks;

        const booksListDescPage1Response = await query({
            query: LIST_BOOKS,
            variables: {
                limit: 2
            }
        });

        expect(booksListDescPage1Response).toEqual({
            books: {
                listBooks: {
                    data: [
                        {
                            id: targetDataModel2.books.createBook.id,
                            title: `Book 2`,
                            description: `Book 2's description.`
                        },
                        {
                            id: targetDataModel1.books.createBook.id,
                            title: `Book 1`,
                            description: `Book 1's description.`
                        }
                    ],
                    meta: {
                        cursor: targetDataModel1.books.createBook.id,
                        limit: 2
                    }
                }
            }
        });

        const booksListDescPage2Response = await query({
            query: LIST_BOOKS,
            variables: {
                limit: 1,
                after: booksListDescPage1Response.books.listBooks.meta.cursor
            }
        });

        expect(booksListDescPage2Response).toEqual({
            books: {
                listBooks: {
                    data: [
                        {
                            id: targetDataModel0.books.createBook.id,
                            title: `Book 0`,
                            description: `Book 0's description.`
                        }
                    ],
                    meta: {
                        cursor: targetDataModel0.books.createBook.id,
                        limit: 1
                    }
                }
            }
        });
    });
});
