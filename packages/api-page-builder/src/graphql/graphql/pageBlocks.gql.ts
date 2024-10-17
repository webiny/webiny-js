import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { compress } from "@webiny/utils/compression/gzip";

import resolve from "./utils/resolve";
import { PbContext } from "../types";
import { PageBlock } from "~/types";

export const createPageBlockGraphQL = new GraphQLSchemaPlugin<PbContext>({
    typeDefs: /* GraphQL */ `
        type PbPageBlock {
            id: ID
            createdOn: DateTime
            createdBy: PbIdentity
            name: String
            blockCategory: String
            content: JSON
        }

        input PbCreatePageBlockInput {
            name: String!
            blockCategory: String!
            content: JSON!
        }

        input PbUpdatePageBlockInput {
            name: String
            blockCategory: String
            content: JSON
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
            updatePageBlock(id: ID!, data: PbUpdatePageBlockInput!): PbPageBlockResponse
            deletePageBlock(id: ID!): PbDeleteResponse
        }
    `,
    resolvers: {
        PbQuery: {
            getPageBlock: async (_, args: any, context) => {
                return resolve(() => {
                    return context.pageBuilder.getPageBlock(args.id);
                });
            },
            listPageBlocks: async (_, args: any, context) => {
                return resolve(() => {
                    return context.benchmark.measure("pageBuilder.listPageBlocks", () => {
                        return context.pageBuilder.listPageBlocks(args);
                    });
                });
            }
        },
        PbMutation: {
            createPageBlock: async (_, args: any, context) => {
                return resolve(() => {
                    return context.pageBuilder.createPageBlock(args.data);
                });
            },
            updatePageBlock: async (_, args: any, context) => {
                return resolve(() => {
                    return context.pageBuilder.updatePageBlock(args.id, args.data);
                });
            },
            deletePageBlock: async (_, args: any, context) => {
                return resolve(() => {
                    return context.pageBuilder.deletePageBlock(args.id);
                });
            }
        },
        PbPageBlock: {
            content: async (block: PageBlock) => {
                const value = await compress(JSON.stringify(block.content));
                return {
                    compression: "gzip",
                    value: value.toString("base64")
                };
            }
        }
    }
});
