import { describe } from "vitest";
import { expect } from "vitest";
import { test } from "vitest";
import { Container } from "@webiny/di";
import useGqlHandler from "./useGqlHandler";
import { CoreGraphQLSchemaFactory } from "~/graphql/abstractions";
import type { GraphQLSchemaBuilder } from "~/features/GraphQLSchemaBuilder/abstractions";
import { GraphQLSchemaCacheFeature } from "~/engine/GraphQLSchemaCacheFeature";
import { GraphQLSchemaKeyVerification } from "~/engine/abstractions";
import { GraphQLSchemaKeyVerificationFeature } from "~/engine/GraphQLSchemaKeyVerificationFeature";
import { staticSchemaKey } from "~/graphql/staticSchemaKey";

interface FactoryState {
    executions: number;
    key: string | null;
    field: string;
}

const createFactory = (state: FactoryState) => {
    class TestSchemaFactory implements CoreGraphQLSchemaFactory.Interface {
        public getSchemaKey?: () => string;

        constructor() {
            if (state.key !== null) {
                this.getSchemaKey = () => state.key as string;
            }
        }

        async execute(builder: GraphQLSchemaBuilder.Interface) {
            state.executions++;
            const field = state.field;
            builder.addTypeDefs(/* GraphQL */ `
                extend type Query {
                    ${field}: String
                }

                extend type Mutation {
                    ${field}Noop: Boolean
                }
            `);
            builder.addResolver({
                path: `Query.${field}`,
                resolver: () => {
                    return () => field;
                }
            });
            return builder;
        }
    }

    return CoreGraphQLSchemaFactory.createImplementation({
        implementation: TestSchemaFactory,
        dependencies: []
    });
};

const createStaticFactory = () => {
    class StaticSchemaFactory implements CoreGraphQLSchemaFactory.Interface {
        public getSchemaKey = staticSchemaKey("Tests/Static");

        async execute(builder: GraphQLSchemaBuilder.Interface) {
            builder.addTypeDefs(/* GraphQL */ `
                extend type Query {
                    staticField: String
                }
            `);
            return builder;
        }
    }

    return CoreGraphQLSchemaFactory.createImplementation({
        implementation: StaticSchemaFactory,
        dependencies: []
    });
};

describe("GraphQL schema key", () => {
    test("runs the factories only on a cache miss when every factory has a schema key", async () => {
        const state: FactoryState = { executions: 0, key: "v1", field: "first" };
        const Factory = createFactory(state);
        const StaticFactory = createStaticFactory();

        const { invoke } = useGqlHandler({
            root: container => GraphQLSchemaCacheFeature.register(container),
            setup: [
                container => {
                    container.register(Factory);
                    container.register(StaticFactory);
                }
            ]
        });

        const [first] = await invoke({ body: { query: "{ first }" } });
        const [second] = await invoke({ body: { query: "{ first }" } });

        expect(first).toEqual({ data: { first: "first" } });
        expect(second).toEqual({ data: { first: "first" } });
        expect(state.executions).toBe(1);
    });

    test("composes again when a schema key changes", async () => {
        const state: FactoryState = { executions: 0, key: "v1", field: "first" };
        const Factory = createFactory(state);

        const { invoke } = useGqlHandler({
            root: container => GraphQLSchemaCacheFeature.register(container),
            setup: [container => container.register(Factory)]
        });

        await invoke({ body: { query: "{ first }" } });
        state.key = "v2";
        state.field = "second";
        const [response] = await invoke({ body: { query: "{ second }" } });

        expect(response).toEqual({ data: { second: "second" } });
        expect(state.executions).toBe(2);
    });

    test("runs the factories on every request when any factory has no schema key", async () => {
        const keyed: FactoryState = { executions: 0, key: "v1", field: "first" };
        const unkeyed: FactoryState = { executions: 0, key: null, field: "other" };
        const KeyedFactory = createFactory(keyed);
        const UnkeyedFactory = createFactory(unkeyed);

        const { invoke } = useGqlHandler({
            root: container => GraphQLSchemaCacheFeature.register(container),
            setup: [
                container => {
                    container.register(KeyedFactory);
                    container.register(UnkeyedFactory);
                }
            ]
        });

        await invoke({ body: { query: "{ first }" } });
        const [response] = await invoke({ body: { query: "{ first other }" } });

        expect(response).toEqual({ data: { first: "first", other: "other" } });
        expect(keyed.executions).toBe(2);
        expect(unkeyed.executions).toBe(2);
    });

    test("verification fails when a factory's output changes under the same schema key", async () => {
        const state: FactoryState = { executions: 0, key: "v1", field: "first" };
        const Factory = createFactory(state);

        const { invoke } = useGqlHandler({
            root: container => {
                GraphQLSchemaCacheFeature.register(container);
                GraphQLSchemaKeyVerificationFeature.register(container);
            },
            setup: [container => container.register(Factory)]
        });

        const [first] = await invoke({ body: { query: "{ first }" } });
        expect(first).toEqual({ data: { first: "first" } });

        // The output changes, the key doesn't.
        state.field = "second";
        const [, response] = await invoke({ body: { query: "{ first }" } });

        expect(response).toMatchObject({ statusCode: 500 });
    });

    test("verification names the factory whose output changed", () => {
        const container = new Container();
        GraphQLSchemaKeyVerificationFeature.register(container);
        const verification = container.resolve(GraphQLSchemaKeyVerification);

        verification.check({ factory: "FirstFactory", key: "v1", output: "a" });
        verification.check({ factory: "FirstFactory", key: "v1", output: "a" });
        verification.check({ factory: "FirstFactory", key: "v2", output: "b" });
        verification.check({ factory: "SecondFactory", key: "v1", output: "c" });

        const check = () => {
            verification.check({ factory: "FirstFactory", key: "v1", output: "changed" });
        };
        expect(check).toThrow(
            '"FirstFactory" produced a different schema under the same schema key "v1"'
        );
    });
});
