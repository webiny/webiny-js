import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { Context } from "../types";
import { emptyResolver } from "./utils";

export const createBaseSchema = () => {
    const demoGraphQL = new GraphQLSchemaPlugin<Context>({
        typeDefs: /* GraphQL */ `
            type DemoError {
                code: String
                message: String
                data: JSON
                stack: String
            }

            type DemoListMeta {
                cursor: String
                totalCount: Int
                hasMoreItems: Boolean
            }

            type DemoQuery {
                _dummy: String
            }

            extend type Query {
                demo: DemoQuery
            }
        `,
        resolvers: {
            Query: {
                demo: emptyResolver
            }
        }
    });
    demoGraphQL.name = "demo.graphql.base";

    return demoGraphQL;
};
