import { graphql } from "graphql";
import plugins from "../template/src/plugins";
import { createUtils } from "./utils";

// TODO: @adrian bring back these tests.
describe.skip("Scaffold GraphQL service test", () => {
    const { useSchema } = createUtils([plugins()]);
    const bookTitle = "Book #1";
    const newBookTitle = "Book #1 [renamed]";
    let book;

    test("List books (0 books)", async () => {
        const query = /* GraphQL */ `
            query {
                books {
                    listBooks {
                        data {
                            id
                            title
                            createdOn
                        }
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const response = await graphql(schema, query, {}, context);

        if (response.errors) {
            throw response.errors;
        }
        expect(response.data.books.listBooks.data.length).toEqual(0);
    });

    test("Create book", async () => {
        const query = /* GraphQL */ `
            mutation createBook($title: String!) {
                books {
                    createBook(data: { title: $title }) {
                        data {
                            id
                            title
                            createdOn
                        }
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const response = await graphql(schema, query, {}, context, {
            title: bookTitle
        });

        if (response.errors) {
            throw response.errors;
        }

        expect(response.data.books.createBook.data).toMatchObject({
            title: bookTitle
        });
        book = response.data.books.createBook.data;
    });

    test("List books (1 book)", async () => {
        const query = /* GraphQL */ `
            query {
                books {
                    listBooks {
                        data {
                            id
                            title
                            createdOn
                        }
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const response = await graphql(schema, query, {}, context);

        if (response.errors) {
            throw response.errors;
        }
        expect(response.data.books.listBooks.data.length).toEqual(1);
        expect(response.data.books.listBooks.data[0]).toMatchObject({
            title: bookTitle
        });
    });

    test("Update book", async () => {
        const query = /* GraphQL */ `
            mutation updateBook($title: String!, $bookId: ID!) {
                books {
                    updateBook(id: $bookId, data: { title: $title }) {
                        data {
                            id
                            title
                            createdOn
                        }
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const response = await graphql(schema, query, {}, context, {
            title: newBookTitle,
            bookId: book.id
        });

        if (response.errors) {
            throw response.errors;
        }

        expect(response.data.books.updateBook.data).toMatchObject({
            title: newBookTitle
        });
    });

    test("Get updated book by ID", async () => {
        const query = /* GraphQL */ `
            query getBook($bookId: ID!) {
                books {
                    getBook(id: $bookId) {
                        data {
                            id
                            title
                            createdOn
                        }
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const response = await graphql(schema, query, {}, context, {
            bookId: book.id
        });

        if (response.errors) {
            throw response.errors;
        }

        expect(response.data.books.getBook.data).toMatchObject({
            title: newBookTitle
        });
    });

    test("Delete book", async () => {
        const query = /* GraphQL */ `
            mutation deleteBook($bookId: ID!) {
                books {
                    deleteBook(id: $bookId) {
                        data
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const response = await graphql(schema, query, {}, context, {
            bookId: book.id
        });

        if (response.errors) {
            throw response.errors;
        }

        expect(response.data.books.deleteBook.data).toEqual(true);
    });

    test("List books (0 books)", async () => {
        const query = /* GraphQL */ `
            query {
                books {
                    listBooks {
                        data {
                            id
                            title
                            createdOn
                        }
                    }
                }
            }
        `;

        const { schema, context } = await useSchema();
        const response = await graphql(schema, query, {}, context);

        if (response.errors) {
            throw response.errors;
        }
        expect(response.data.books.listBooks.data.length).toEqual(0);
    });
});
