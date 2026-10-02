import { describe } from "vitest";
import { expect } from "vitest";
import { test } from "vitest";
import { Container } from "@webiny/di";
import type { GraphQLSchema } from "graphql";
import useGqlHandler from "./useGqlHandler";
import { CoreGraphQLSchemaFactory } from "~/graphql/abstractions";
import type { GraphQLSchemaBuilder } from "~/features/GraphQLSchemaBuilder/abstractions";
import { GraphQLSchemaCache } from "~/engine/abstractions";
import { GraphQLSchemaCacheFeature } from "~/engine/GraphQLSchemaCacheFeature";
import { createAbstraction } from "@webiny/feature/api";

interface IGreeter {
    greet(): string;
}

const Greeter = createAbstraction<IGreeter>("Tests/Greeter");

class GreetingSchema implements CoreGraphQLSchemaFactory.Interface {
    async execute(builder: GraphQLSchemaBuilder.Interface) {
        builder.addTypeDefs(/* GraphQL */ `
            extend type Query {
                greeting: String
            }

            extend type Mutation {
                noop: Boolean
            }
        `);
        builder.addResolver({
            path: "Query.greeting",
            dependencies: [Greeter],
            resolver: (greeter: IGreeter) => {
                return () => greeter.greet();
            }
        });
        return builder;
    }
}

const GreetingSchemaFactory = CoreGraphQLSchemaFactory.createImplementation({
    implementation: GreetingSchema,
    dependencies: []
});

const createSchemaFactory = (params: {
    schemas: GraphQLSchema[];
    withExtraField: () => boolean;
}) => {
    class SchemaFactory implements CoreGraphQLSchemaFactory.Interface {
        async execute(builder: GraphQLSchemaBuilder.Interface) {
            builder.addTypeDefs(/* GraphQL */ `
                extend type Query {
                    greeting: String
                }

                extend type Mutation {
                    noop: Boolean
                }
            `);
            if (params.withExtraField()) {
                builder.addTypeDefs(/* GraphQL */ `
                    extend type Query {
                        extra: String
                    }
                `);
            }
            builder.addResolver({
                path: "Query.greeting",
                resolver: () => {
                    return ({ info }) => {
                        params.schemas.push(info.schema);
                        return "Hello";
                    };
                }
            });
            return builder;
        }
    }

    return CoreGraphQLSchemaFactory.createImplementation({
        implementation: SchemaFactory,
        dependencies: []
    });
};

const QUERY = { query: "{ greeting }" };

describe("GraphQL schema cache", () => {
    test("builds the schema once when the type definitions don't change", async () => {
        const schemas: GraphQLSchema[] = [];
        const SchemaFactory = createSchemaFactory({ schemas, withExtraField: () => false });

        const { invoke } = useGqlHandler({
            root: container => GraphQLSchemaCacheFeature.register(container),
            setup: [container => container.register(SchemaFactory)]
        });

        const [first] = await invoke({ body: QUERY });
        const [second] = await invoke({ body: QUERY });

        expect(first).toEqual({ data: { greeting: "Hello" } });
        expect(second).toEqual({ data: { greeting: "Hello" } });
        expect(schemas).toHaveLength(2);
        expect(schemas[0]).toBe(schemas[1]);
    });

    test("builds a new schema when the type definitions change", async () => {
        const schemas: GraphQLSchema[] = [];
        let withExtraField = false;
        const SchemaFactory = createSchemaFactory({
            schemas,
            withExtraField: () => withExtraField
        });

        const { invoke } = useGqlHandler({
            root: container => GraphQLSchemaCacheFeature.register(container),
            setup: [container => container.register(SchemaFactory)]
        });

        await invoke({ body: QUERY });
        withExtraField = true;
        await invoke({ body: QUERY });

        expect(schemas).toHaveLength(2);
        expect(schemas[0]).not.toBe(schemas[1]);
        expect(schemas[1].getQueryType()?.getFields().extra).toBeDefined();
    });

    test("builds the schema on every request without a cache in the root container", async () => {
        const schemas: GraphQLSchema[] = [];
        const SchemaFactory = createSchemaFactory({ schemas, withExtraField: () => false });

        const { invoke } = useGqlHandler({
            setup: [container => container.register(SchemaFactory)]
        });

        await invoke({ body: QUERY });
        await invoke({ body: QUERY });

        expect(schemas).toHaveLength(2);
        expect(schemas[0]).not.toBe(schemas[1]);
    });

    test("drops the least recently used schema once full", () => {
        const container = new Container();
        GraphQLSchemaCacheFeature.register(container);
        const cache = container.resolve(GraphQLSchemaCache);

        const builds: string[] = [];
        const build = (key: string) => () => {
            builds.push(key);
            return { key } as unknown as GraphQLSchema;
        };

        for (let i = 0; i < 10; i++) {
            cache.getOrBuild(`key-${i}`, build(`key-${i}`));
        }
        // Touch key-0 so key-1 becomes the least recently used entry.
        cache.getOrBuild("key-0", build("key-0"));
        cache.getOrBuild("key-10", build("key-10"));

        cache.getOrBuild("key-0", build("key-0"));
        cache.getOrBuild("key-1", build("key-1"));

        expect(builds.filter(key => key === "key-0")).toHaveLength(1);
        expect(builds.filter(key => key === "key-1")).toHaveLength(2);
    });

    test("resolves resolver dependencies from the request that runs the query, not the one that built the schema", async () => {
        // The cache keeps the resolvers from the request that built the schema. Each request
        // registers a different Greeter, so the second answer proves the resolver looked its
        // dependency up in the second request's container.
        const greetings = ["Hello from request 1", "Hello from request 2"];
        let request = 0;

        const { invoke } = useGqlHandler({
            root: container => GraphQLSchemaCacheFeature.register(container),
            setup: [
                container => {
                    const greeting = greetings[request++];
                    container.registerInstance(Greeter, { greet: () => greeting });
                    container.register(GreetingSchemaFactory);
                }
            ]
        });

        const [first] = await invoke({ body: QUERY });
        const [second] = await invoke({ body: QUERY });

        expect(first).toEqual({ data: { greeting: "Hello from request 1" } });
        expect(second).toEqual({ data: { greeting: "Hello from request 2" } });
    });
});
