import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { CustomFieldsPage } from "~tests/types";

const createPageGraphQlSchemaPlugin = () => {
    return new GraphQLSchemaPlugin({
        typeDefs: `
        extend type PbPage {
            customViews: Number!
        }
        
        extend type PbPageListItem {
            customViews: Number!
        }
        
        extend input PbUpdatePageInput {
            customViews: Number!
        }
        
        extend input PbListPagesWhereInput {
            customViews: Number
            customViews_gt: Number
            customViews_gte: Number
            customViews_lt: Number
            customViews_lte: Number
            customViews_not: Number
            customViews_between: [Number!]
        }
        
        extend input PbListPublishedPagesWhereInput {
            customViews: Number
            customViews_gt: Number
            customViews_gte: Number
            customViews_lt: Number
            customViews_lte: Number
            customViews_not: Number
            customViews_between: [Number!]
        }
        
        extend enum PbListPagesSort {
            customViews_ASC
            customViews_DESC
        }
        `,
        resolvers: {
            PbPage: {
                customViews: (parent: CustomFieldsPage) => {
                    return parent.customViews || 0;
                }
            }
        }
    });
};

export const createGraphQlSchemaPlugins = () => {
    return [createPageGraphQlSchemaPlugin()];
};
