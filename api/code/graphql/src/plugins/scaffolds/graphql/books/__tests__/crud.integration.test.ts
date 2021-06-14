import { handler } from "~/index";
import { GET_BOOK, CREATE_BOOK, DELETE_BOOK, LIST_BOOKS, UPDATE_BOOK } from "./graphql/books";

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
                })
            );
        }
    });

    afterEach(async () => {
        for (let i = 0; i < 3; i++) {
            await query({
                query: DELETE_BOOK,
                variables: {
                    id: testBooks[i].data.books.createBook.id
                }
            });
        }
        testBooks = [];
    });

    it("should be able to perform basic CRUD operations", async () => {
        // 1. Now that we have books created, let's see if they come up in a basic listBooks query.
        const [targetDataModel0, targetDataModel1, targetDataModel2] = testBooks;

        const booksListResponse = await query({ query: LIST_BOOKS });

        expect(booksListResponse).toEqual({
            data: {
                books: {
                    listBooks: {
                        data: [
                            {
                                id: targetDataModel2.data.books.createBook.id,
                                title: `Book 2`,
                                description: `Book 2's description.`
                            },
                            {
                                id: targetDataModel1.data.books.createBook.id,
                                title: `Book 1`,
                                description: `Book 1's description.`
                            },
                            {
                                id: targetDataModel0.data.books.createBook.id,
                                title: `Book 0`,
                                description: `Book 0's description.`
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
            query: DELETE_BOOK,
            variables: {
                id: targetDataModel1.data.books.createBook.id
            }
        });

        const booksListAfterDeleteResponse = await query({
            query: LIST_BOOKS
        });

        expect(booksListAfterDeleteResponse).toEqual({
            data: {
                books: {
                    listBooks: {
                        data: [
                            {
                                id: targetDataModel2.data.books.createBook.id,
                                title: `Book 2`,
                                description: `Book 2's description.`
                            },
                            {
                                id: targetDataModel0.data.books.createBook.id,
                                title: `Book 0`,
                                description: `Book 0's description.`
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
            query: UPDATE_BOOK,
            variables: {
                id: targetDataModel0.data.books.createBook.id,
                data: {
                    title: "Book 0 - UPDATED",
                    description: `Book 0's description - UPDATED.`
                }
            }
        });

        expect(updateResponse).toEqual({
            data: {
                books: {
                    updateBook: {
                        id: targetDataModel0.data.books.createBook.id,
                        title: "Book 0 - UPDATED",
                        description: `Book 0's description - UPDATED.`
                    }
                }
            }
        });

        // 5. Get targetDataModel 0 after the update.
        const getResponse = await query({
            query: GET_BOOK,
            variables: {
                id: targetDataModel0.data.books.createBook.id
            }
        });

        expect(getResponse).toEqual({
            data: {
                books: {
                    getBook: {
                        id: targetDataModel0.data.books.createBook.id,
                        title: "Book 0 - UPDATED",
                        description: `Book 0's description - UPDATED.`
                    }
                }
            }
        });
    });

    test("should be able to sort books", async () => {
        const [targetDataModel0, targetDataModel1, targetDataModel2] = testBooks;

        const booksListDescResponse = await query({
            query: LIST_BOOKS,
            variables: {
                sort: "createdOn_DESC"
            }
        });

        expect(booksListDescResponse).toEqual({
            data: {
                books: {
                    listBooks: {
                        data: [
                            {
                                id: targetDataModel2.data.books.createBook.id,
                                title: `Book 2`,
                                description: `Book 2's description.`
                            },
                            {
                                id: targetDataModel1.data.books.createBook.id,
                                title: `Book 1`,
                                description: `Book 1's description.`
                            },
                            {
                                id: targetDataModel0.data.books.createBook.id,
                                title: `Book 0`,
                                description: `Book 0's description.`
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

        const booksListAscResponse = await query({
            query: LIST_BOOKS,
            variables: {
                sort: "createdOn_ASC"
            }
        });

        expect(booksListAscResponse).toEqual({
            data: {
                books: {
                    listBooks: {
                        data: [
                            {
                                id: targetDataModel0.data.books.createBook.id,
                                title: `Book 0`,
                                description: `Book 0's description.`
                            },
                            {
                                id: targetDataModel1.data.books.createBook.id,
                                title: `Book 1`,
                                description: `Book 1's description.`
                            },
                            {
                                id: targetDataModel2.data.books.createBook.id,
                                title: `Book 2`,
                                description: `Book 2's description.`
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
        const [targetDataModel0, targetDataModel1, targetDataModel2] = testBooks;

        const booksListDescPage1Response = await query({
            query: LIST_BOOKS,
            variables: {
                limit: 2
            }
        });

        expect(booksListDescPage1Response).toEqual({
            data: {
                books: {
                    listBooks: {
                        data: [
                            {
                                id: targetDataModel2.data.books.createBook.id,
                                title: `Book 2`,
                                description: `Book 2's description.`
                            },
                            {
                                id: targetDataModel1.data.books.createBook.id,
                                title: `Book 1`,
                                description: `Book 1's description.`
                            }
                        ],
                        meta: {
                            cursor: targetDataModel1.data.books.createBook.id,
                            limit: 2
                        }
                    }
                }
            }
        });

        const booksListDescPage2Response = await query({
            query: LIST_BOOKS,
            variables: {
                limit: 2,
                after: booksListDescPage1Response.data.books.listBooks.meta.cursor
            }
        });

        expect(booksListDescPage2Response).toEqual({
            data: {
                books: {
                    listBooks: {
                        data: [
                            {
                                id: targetDataModel0.data.books.createBook.id,
                                title: `Book 0`,
                                description: `Book 0's description.`
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

        const booksListAscPage1Response = await query({
            query: LIST_BOOKS,
            variables: {
                limit: 2,
                sort: "createdOn_ASC"
            }
        });

        expect(booksListAscPage1Response).toMatchObject({
            data: {
                books: {
                    listBooks: {
                        data: [
                            {
                                id: targetDataModel0.data.books.createBook.id,
                                title: `Book 0`,
                                description: `Book 0's description.`
                            },
                            {
                                id: targetDataModel1.data.books.createBook.id,
                                title: `Book 1`,
                                description: `Book 1's description.`
                            }
                        ],
                        meta: {
                            cursor: targetDataModel1.data.books.createBook.id,
                            limit: 2
                        }
                    }
                }
            }
        });

        const booksListAscPage2Response = await query({
            query: LIST_BOOKS,
            variables: {
                limit: 2,
                sort: "createdOn_ASC",
                after: booksListAscPage1Response.data.books.listBooks.meta.cursor
            }
        });

        expect(booksListAscPage2Response).toEqual({
            data: {
                books: {
                    listBooks: {
                        data: [
                            {
                                id: targetDataModel2.data.books.createBook.id,
                                title: `Book 2`,
                                description: `Book 2's description.`
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
