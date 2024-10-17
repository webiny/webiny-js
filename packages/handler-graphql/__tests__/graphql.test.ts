import useGqlHandler from "./useGqlHandler";
import { booksSchema, booksCrudPlugin } from "~tests/mocks/booksSchema";
import { createGraphQLSchemaPlugin } from "~/plugins";
import { createResolverDecorator } from "~/index";
import { Context } from "./types";

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
        const { invoke } = useGqlHandler({ debug: true, plugins: [booksCrudPlugin, booksSchema] });
        const [response] = await invoke({ body: { query: `{ books { name } }` } });
        expect(response.errors).toBeFalsy();
        expect(response.data.books.length).toBe(2);
        expect(response.extensions.console.length).toBe(5);
    });

    test("should return logs for specific queries when executed in batch", async () => {
        const { invoke } = useGqlHandler({ debug: true, plugins: [booksCrudPlugin, booksSchema] });
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

    test("should compose resolvers", async () => {
        const lowerCaseName = createResolverDecorator<any, any, Context>(
            resolver => async (parent, args, context, info) => {
                const name = await resolver(parent, args, context, info);

                return name.toLowerCase();
            }
        );

        const listBooks = createResolverDecorator(() => async () => {
            return [{ name: "Article 1" }];
        });

        const decorator1 = createGraphQLSchemaPlugin({
            resolverDecorators: {
                "Query.books": [listBooks],
                "Book.name": [lowerCaseName]
            }
        });

        const addNameSuffix = createResolverDecorator(resolver => async (...args) => {
            const name = await resolver(...args);

            return `${name} (suffix)`;
        });

        const decorator2 = createGraphQLSchemaPlugin({
            resolverDecorators: {
                "Book.name": [addNameSuffix]
            }
        });

        const { invoke } = useGqlHandler({
            debug: true,
            plugins: [booksCrudPlugin, booksSchema, decorator1, decorator2]
        });
        const [response] = await invoke({ body: { query: `{ books { name } }` } });
        expect(response.errors).toBeFalsy();
        expect(response.data.books.length).toBe(1);
        expect(response.data.books[0].name).toBe("article 1 (suffix)");
    });
});
