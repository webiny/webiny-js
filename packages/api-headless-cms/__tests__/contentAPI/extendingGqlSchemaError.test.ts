import { describe, expect, it } from "vitest";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { createCmsGraphQLSchemaPlugin } from "~/plugins";

const graphqlSchemaPlugin = createCmsGraphQLSchemaPlugin({
    typeDefs: /* GraphQL */ `
        type BrokenType {
            # types without fields are invalid
        }
    `
});

describe("invalid schema error formatting", () => {
    it("print invalid part of the schema", async () => {
        const { invoke } = useGraphQLHandler({
            path: "manage",
            plugins: [graphqlSchemaPlugin]
        });

        const [response] = await invoke({
            body: { query: `{ irrelevant }` }
        });

        expect(response).toEqual({
            message: 'Syntax Error: Expected Name, found "}".',
            code: "INVALID_GRAPHQL_SCHEMA",
            data: {
                invalidSegment: expect.stringContaining("type BrokenType")
            }
        });
    });
});
