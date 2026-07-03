import { describe, test, expect } from "vitest";
import useGqlHandler from "./useGqlHandler";
import { booksSchema, booksCrudPlugin } from "~tests/mocks/booksSchema.legacy";
import { createGraphQLSchemaPlugin } from "~/plugins";
import { createResolverDecorator } from "~/index";
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
        const { introspect } = useGqlHandler({ plugins: [booksSchema] });
        const [response] = await introspect();
        expect(response.errors).toBeFalsy();
        expect(response.data.__schema).toBeTruthy();
    });

    test("should compose resolvers", async () => {
        const lowerCaseName = createResolverDecorator<any, any, Context>(
            resolver => async (parent, args, context, info) => {
                const name = (await resolver(parent, args, context, info)) as string;

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
            plugins: [booksCrudPlugin, booksSchema, decorator1, decorator2]
        });
        const [response] = await invoke({ body: { query: `{ books { name } }` } });
        expect(response.errors).toBeFalsy();
        expect(response.data.books.length).toBe(1);
        expect(response.data.books[0].name).toBe("article 1 (suffix)");
    });
});
