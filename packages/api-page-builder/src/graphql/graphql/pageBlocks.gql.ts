import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";

import resolve from "./utils/resolve";
import { PbContext } from "../types";

export const createPageBlockGraphQL = new GraphQLSchemaPlugin<PbContext>({
    typeDefs: /* GraphQL */ `
        type PbPageBlock {
            id: ID
            createdOn: DateTime
            createdBy: PbCreatedBy
            name: String
            blockCategory: String
            content: JSON
            preview: JSON
        }

        input PbCreatePageBlockInput {
            name: String!
            blockCategory: String!
            content: JSON!
            preview: JSON!
        }

        input PbListPageBlocksWhereInput {
            blockCategory: String
        }

        # Response types
        type PbPageBlockResponse {
            data: PbPageBlock
            error: PbError
        }

        type PbPageBlockListResponse {
            data: [PbPageBlock]
            error: PbError
        }

        extend type PbQuery {
            listPageBlocks(where: PbListPageBlocksWhereInput): PbPageBlockListResponse
            getPageBlock(id: ID!): PbPageBlockResponse
        }

        extend type PbMutation {
            createPageBlock(data: PbCreatePageBlockInput!): PbPageBlockResponse
        }
    `,
    resolvers: {
        PbQuery: {
            getPageBlock: async (_, args: any, context) => {
                return resolve(() => {
                    return context.pageBuilder.getPageBlock(args.id);
                });
            },
            listPageBlocks: async (_, __, context) => {
                return resolve(() => {
                    return context.pageBuilder.listPageBlocks();
                });
            }
        },
        PbMutation: {
            createPageBlock: async (_, args: any, context) => {
                return resolve(() => {
                    return context.pageBuilder.createPageBlock(args.data);
                });
            }
        }
    }
});
