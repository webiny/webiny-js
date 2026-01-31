import { describe, test, expect } from "vitest";
import useGqlHandler from "./useGqlHandler";
import { booksSchemaPlugin, booksCrudPlugin } from "~tests/mocks/booksSchema";
import { CoreGraphQLSchemaFactory } from "~/graphql/abstractions";
import type { GraphQLSchemaBuilder } from "~/features/GraphQLSchemaBuilder/abstractions";
import { createContextPlugin } from "@webiny/handler";
import type { Context } from "./types";

describe("GraphQL Handler", () => {
    test("should return errors if schema doesn't exist", async () => {
        const { introspect } = useGqlHandler();

        const [response] = await introspect();
        expect(response.errors).toBeTruthy();
        expect(response.errors[0].message).toBe("Type Query must define one or more fields.");
        expect(response.errors[1].message).toBe("Type Mutation must define one or more fields.");
    });

    test("should return introspection query result", async () => {
        const { introspect } = useGqlHandler({ plugins: [booksSchemaPlugin] });
        const [response] = await introspect();
        expect(response.errors).toBeFalsy();
        expect(response.data.__schema).toBeTruthy();
    });

    test("should return logs in the extensions", async () => {
        const { invoke } = useGqlHandler({
            debug: true,
            plugins: [booksCrudPlugin, booksSchemaPlugin]
        });
        const [response] = await invoke({ body: { query: `{ books { name } }` } });
        expect(response.errors).toBeFalsy();
        expect(response.data.books.length).toBe(2);
        expect(response.extensions.console.length).toBe(6);
    });

    test("should return logs for specific queries when executed in batch", async () => {
        const { invoke } = useGqlHandler({
            debug: true,
            plugins: [booksCrudPlugin, booksSchemaPlugin]
        });
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
                { method: "log", args: ["books resolver"] },
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
        // Create decorator schema using the builder pattern
        class DecoratorsSchema implements CoreGraphQLSchemaFactory.Interface {
            async execute(
                builder: GraphQLSchemaBuilder.Interface
            ): Promise<GraphQLSchemaBuilder.Interface> {
                // Add decorator to replace Query.books resolver
                builder.addResolverDecorator("Query.books", () => async () => {
                    return [{ name: "Article 1" }];
                });

                // Add decorator to lowercase Book.name
                builder.addResolverDecorator(
                    "Book.name",
                    (resolver: any) => async (parent: any, args: any, context: any, info: any) => {
                        const name = (await resolver(parent, args, context, info)) as string;
                        return name.toLowerCase();
                    }
                );

                // Add decorator to add suffix to Book.name
                builder.addResolverDecorator(
                    "Book.name",
                    (resolver: any) =>
                        async (...args: any[]) => {
                            const name = await resolver(...args);
                            return `${name} (suffix)`;
                        }
                );

                return builder;
            }
        }

        const DecoratorsSchemaImpl = CoreGraphQLSchemaFactory.createImplementation({
            implementation: DecoratorsSchema,
            dependencies: []
        });

        const decoratorsPlugin = createContextPlugin<Context>(context => {
            context.container.register(DecoratorsSchemaImpl);
        });

        const { invoke } = useGqlHandler({
            debug: true,
            plugins: [booksCrudPlugin, booksSchemaPlugin, decoratorsPlugin]
        });
        const [response] = await invoke({ body: { query: `{ books { name } }` } });
        expect(response.errors).toBeFalsy();
        expect(response.data.books.length).toBe(1);
        expect(response.data.books[0].name).toBe("article 1 (suffix)");
    });
});
