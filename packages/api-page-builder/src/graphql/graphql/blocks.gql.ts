import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";

import resolve from "./utils/resolve";
import { PbContext } from "../types";

export const createBlockGraphQL = new GraphQLSchemaPlugin<PbContext>({
    typeDefs: /* GraphQL */ `
        type PbBlock {
            id: ID
            createdOn: DateTime
            createdBy: PbCreatedBy
            name: String
            blockCategory: String
            type: String
            content: JSON
            preview: JSON
        }

        """
        This input type is used by users to create Page Blocks.
        """
        input PbCreateBlockInput {
            name: String!
            type: String!
            blockCategory: String!
            content: JSON!
            preview: JSON!
        }

        # Response types
        type PbBlockResponse {
            data: PbBlock
            error: PbError
        }

        extend type PbMutation {
            createBlock(data: PbCreateBlockInput!): PbBlockResponse
        }
    `,
    resolvers: {
        PbMutation: {
            createBlock: async (_, args: any, context) => {
                return resolve(() => {
                    return context.pageBuilder.createBlock(args.data);
                });
            }
        }
    }
});
