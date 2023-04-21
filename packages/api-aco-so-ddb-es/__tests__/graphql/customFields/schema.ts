import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";

export const createSchemaPlugin = () => {
    return new GraphQLSchemaPlugin({
        typeDefs: `
            extend input SearchRecordListWhereInput {
                num: Number
                num_gt: Number
                num_gte: Number
                num_lt: Number
                num_lte: Number
                num_in: [Number!]
                num_not: Number
                something: String
                something_in: [String!]
                something_not: String
                something_contains: String
            }
    
            extend input AcoSort {
                num: AcoSortDirection
            }
        `
    });
};
