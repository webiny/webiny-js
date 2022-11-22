import useGqlHandler from "./useGqlHandler";
import { GraphQLSchemaPlugin } from "~/types";
import { ContextPlugin } from "@webiny/api";

const books = [
    {
        name: "Book 1"
    },
    {
        name: "Book 2"
    }
];

const crudPlugin = new ContextPlugin(async context => {
    (context as any).getBooks = () => {
        console.log("getBooks");
        console.table(books);
        console.warn("Your store is quite empty!");
        return books;
    };
});

const booksSchema: GraphQLSchemaPlugin = {
    type: "graphql-schema",
    schema: {
        typeDefs: /* GraphQL */ `
            type Book {
                name: String
            }

            extend type Query {
                books: [Book]
                book(name: String!): Book
            }

            extend type Mutation {
                createBook: Boolean
            }
        `,
        resolvers: {
            Query: {
                books(_, __, context: any) {
                    console.group("books resolver");
                    const books = context.getBooks();
                    console.groupEnd();
                    return books;
                },
                book(_, { name }) {
                    console.log("Find book by name");
                    const book = books.find(b => b.name === name);
                    if (book) {
                        console.log(`Found book "${book.name}"`);
                        return book;
                    }
                    console.log(`Book not found!`);
                    return null;
                }
            },
            Mutation: {
                createBook: () => true
            }
        }
    }
};

describe("GraphQL Handler", () => {
    test("should return errors if schema doesn't exist", async () => {
        const { introspect } = useGqlHandler();

        const [response] = await introspect();
        expect(response.errors).toBeTruthy();
        expect(response.errors[0].message).toBe("Type Query must define one or more fields.");
        expect(response.errors[1].message).toBe("Type Mutation must define one or more fields.");
    });

    test("should return introspection query result", async () => {
        const { introspect } = useGqlHandler({ plugins: [booksSchema] });
        const [response] = await introspect();
        expect(response.errors).toBeFalsy();
        expect(response.data.__schema).toBeTruthy();
    });

    test("should return logs in the extensions", async () => {
        const { invoke } = useGqlHandler({ debug: true, plugins: [crudPlugin, booksSchema] });
        const [response] = await invoke({ body: { query: `{ books { name } }` } });
        expect(response.errors).toBeFalsy();
        expect(response.data.books.length).toBe(2);
        expect(response.extensions.console.length).toBe(5);
    });

    test("should return logs for specific queries when executed in batch", async () => {
        const { invoke } = useGqlHandler({ debug: true, plugins: [crudPlugin, booksSchema] });
        const [[r1, r2, r3]] = await invoke({
            body: [
                { query: `{ books { name } }` },
                { query: `{ book(name: "Book 1") { name } }` },
                { query: `{ book(name: "Book 3") { name } }` }
            ]
        });

        expect(r1.data.books.length).toBe(2);
        expect(r1.errors).toBeFalsy();
        expect(r1.extensions).toStrictEqual({
            console: [
                { method: "group", args: ["books resolver"] },
                { method: "log", args: ["getBooks"] },
                {
                    method: "table",
                    args: [
                        [
                            {
                                name: "Book 1"
                            },
                            {
                                name: "Book 2"
                            }
                        ]
                    ]
                },
                { method: "warn", args: ["Your store is quite empty!"] },
                { method: "groupEnd", args: [] }
            ]
        });
        expect(r2.data.book.name).toBe("Book 1");
        expect(r2.errors).toBeFalsy();
        expect(r2.extensions).toStrictEqual({
            console: [
                { method: "log", args: ["Find book by name"] },
                { method: "log", args: ['Found book "Book 1"'] }
            ]
        });
        expect(r3.data.book).toBe(null);
        expect(r3.errors).toBeFalsy();
        expect(r3.extensions).toStrictEqual({
            console: [
                { method: "log", args: ["Find book by name"] },
                { method: "log", args: ["Book not found!"] }
            ]
        });
    });
});
