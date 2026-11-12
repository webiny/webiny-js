import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { createContextPlugin } from "@webiny/handler";
import useGqlHandler from "./useGqlHandler";
import { CoreGraphQLSchemaFactory } from "~/graphql/abstractions.js";
import type { GraphQLSchemaBuilder } from "~/features/GraphQLSchemaBuilder/abstractions.js";
import type { Context } from "~tests/types";

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

const brokenSchemaPlugin = createContextPlugin<Context>(context => {
    context.container.register(
        CoreGraphQLSchemaFactory.createImplementation({
            implementation: BrokenSchema,
            dependencies: []
        })
    );
});

/**
 * Security: a schema build failure must not return the stack trace unless DEBUG is on.
 */
describe("GraphQL schema build error", () => {
    const originalDebug = process.env.DEBUG;

    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        process.env.DEBUG = originalDebug;
    });

    test("should not return the stack when DEBUG is off", async () => {
        process.env.DEBUG = "false";
        const { invoke } = useGqlHandler({ plugins: [brokenSchemaPlugin] });

        const [body, response] = await invoke({ body: { query: `{ broken }` } });

        expect(response.statusCode).toBe(500);
        expect(typeof body.message).toBe("string");
        expect(body.stack).toBeNull();
    });

    test("should return the stack when DEBUG is on", async () => {
        process.env.DEBUG = "true";
        const { invoke } = useGqlHandler({ plugins: [brokenSchemaPlugin] });

        const [body, response] = await invoke({ body: { query: `{ broken }` } });

        expect(response.statusCode).toBe(500);
        expect(typeof body.stack).toBe("string");
    });
});
