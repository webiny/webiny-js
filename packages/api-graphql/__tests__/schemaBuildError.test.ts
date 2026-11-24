import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import type { Container } from "@webiny/di";
import useGqlHandler from "./useGqlHandler";
import { CoreGraphQLSchemaFactory } from "~/graphql/abstractions.js";
import type { GraphQLSchemaBuilder } from "~/features/GraphQLSchemaBuilder/abstractions.js";

class BrokenSchema implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaBuilder.Interface
    ): Promise<GraphQLSchemaBuilder.Interface> {
        builder.addTypeDefs(/* GraphQL */ `
            extend type Query {
                broken: TypeThatDoesNotExist
            }
        `);
        return builder;
    }
}

const brokenSchemaPlugin = (container: Container) => {
    container.register(
        CoreGraphQLSchemaFactory.createImplementation({
            implementation: BrokenSchema,
            dependencies: []
        })
    );
};

/**
 * Security: a schema build failure must not return the stack trace.
 */
describe("GraphQL schema build error", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("should not return the stack", async () => {
        const { invoke } = useGqlHandler({ setup: [brokenSchemaPlugin] });

        const [body, response] = await invoke({ body: { query: `{ broken }` } });

        expect(response.statusCode).toBe(500);
        expect(JSON.stringify(body)).not.toContain("    at ");
        expect(body.stack ?? null).toBeNull();
    });
});
