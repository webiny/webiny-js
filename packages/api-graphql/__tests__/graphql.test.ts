import { describe, test, expect } from "vitest";
import useGqlHandler from "./useGqlHandler";
import { booksSchemaPlugin, booksCrudPlugin } from "~tests/mocks/booksSchema";
import { CoreGraphQLSchemaFactory } from "~/graphql/abstractions";
import type { GraphQLSchemaBuilder } from "~/features/GraphQLSchemaBuilder/abstractions";
import type { Container } from "@webiny/di";

describe("GraphQL Handler", () => {
    test("should return errors if schema doesn't exist", async () => {
        const { introspect } = useGqlHandler();

        const [response] = await introspect();
        expect(response.errors).toBeTruthy();
        expect(response.errors[0].message).toBe("Type Query must define one or more fields.");
        expect(response.errors[1].message).toBe("Type Mutation must define one or more fields.");
    });

    test("should return introspection query result", async () => {
        const { introspect } = useGqlHandler({ setup: [booksSchemaPlugin] });
        const [response] = await introspect();
        expect(response.errors).toBeFalsy();
        expect(response.data.__schema).toBeTruthy();
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

        const decoratorsPlugin = (container: Container) => {
            container.register(DecoratorsSchemaImpl);
        };

        const { invoke } = useGqlHandler({
            setup: [booksCrudPlugin, booksSchemaPlugin, decoratorsPlugin]
        });
        const [response] = await invoke({ body: { query: `{ books { name } }` } });
        expect(response.errors).toBeFalsy();
        expect(response.data.books.length).toBe(1);
        expect(response.data.books[0].name).toBe("article 1 (suffix)");
    });
});
