import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import resolve from "./utils/resolve";
import { PbContext } from "../types";

export const createBlockGraphQL: GraphQLSchemaPlugin<PbContext> = {
    type: "graphql-schema",
    schema: {
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
    }
};
