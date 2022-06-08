import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";

import resolve from "./utils/resolve";
import { PbContext } from "../types";

export const createPageBlockGraphQL =new GraphQLSchemaPlugin<PbContext>({
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

                # Response types
                type PbPageBlockResponse {
                    data: PbPageBlock
                    error: PbError
                }

                extend type PbMutation {
                    createPageBlock(data: PbCreatePageBlockInput!): PbPageBlockResponse
                }
            `,
            resolvers: {
                PbMutation: {
                    createPageBlock: async (_, args: any, context) => {
                        return resolve(() => {
                            return context.pageBuilder.createPageBlock(args.data);
                        });
                    }
                }
            }
        }
);
