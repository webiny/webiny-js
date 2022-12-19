import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";

const graphqlSchemaPlugin = new GraphQLSchemaPlugin({
    typeDefs: /* GraphQL */ `
        type BrokenType {
            # types without fields are invalid
        }
    `
});

describe("invalid schema error formatting", () => {
    test("print invalid part of the schema", async () => {
        const { invoke } = useGraphQLHandler({
            path: "manage/en-US",
            plugins: [graphqlSchemaPlugin]
        });

        const [{ error }] = await invoke({
            body: { query: `{ irrelevant }` }
        });

        expect(error).toEqual({
            message: 'Syntax Error: Expected Name, found "}".',
            code: "INVALID_GRAPHQL_SCHEMA",
            data: {
                invalidSegment: expect.stringContaining("type BrokenType")
            }
        });
    });
});
