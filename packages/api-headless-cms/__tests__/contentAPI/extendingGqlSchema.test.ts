import { useGraphQLHandler } from "../utils/useGraphQLHandler";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";

const graphqlSchemaPlugin = new GraphQLSchemaPlugin({
    typeDefs: /* GraphQL */ `
        extend type Query {
            getOne: Int
            getFifty: Int
            getHundred: Int
        }
    `,
    resolvers: {
        Query: {
            getOne: () => {
                return 1;
            },
            getFifty: () => {
                return 50;
            },
            getHundred: () => {
                return 100;
            }
        }
    }
});

describe("content model test no field plugin", () => {
    test("prevent content model update if a backend plugin for a field does not exist", async () => {
        const { invoke } = useGraphQLHandler({
            path: "manage/en-US",
            plugins: [graphqlSchemaPlugin]
        });

        expect(
            await invoke({
                body: { query: `{ getOne getFifty getHundred }` }
            }).then(([data]) => data)
        ).toEqual({
            data: {
                getOne: 1,
                getFifty: 50,
                getHundred: 100
            }
        });
    });
});
