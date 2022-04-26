import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import resolve from "./utils/resolve";
import { PbContext } from "../types";

export const createPageElementsGraphQL = (): GraphQLSchemaPlugin<PbContext> => {
    return {
        type: "graphql-schema",
        schema: {
            typeDefs: /* GraphQL */ `
                type PbPageElement {
                    id: ID
                    createdOn: DateTime
                    createdBy: PbCreatedBy
                    name: String
                    category: String
                    type: String
                    content: JSON
                    preview: JSON
                }

                input PbCreatePageElementInput {
                    name: String!
                    type: String!
                    category: String!
                    content: JSON!
                    preview: JSON!
                }

                input PbUpdatePageElementInput {
                    name: String
                    type: String
                    category: String
                    content: JSON
                    preview: JSON
                }

                # Response types
                type PbPageElementResponse {
                    data: PbPageElement
                    error: PbError
                }

                type PbPageElementListResponse {
                    data: [PbPageElement]
                    error: PbError
                }

                extend type PbQuery {
                    listPageElements: PbPageElementListResponse
                    getPageElement(id: ID!): PbPageElementResponse
                }

                extend type PbMutation {
                    createPageElement(data: PbCreatePageElementInput!): PbPageElementResponse
                    updatePageElement(
                        id: ID!
                        data: PbUpdatePageElementInput!
                    ): PbPageElementResponse
                    deletePageElement(id: ID!): PbPageElementResponse
                }
            `,
            resolvers: {
                PbQuery: {
                    getPageElement: async (_, args: any, context) => {
                        return resolve(() => {
                            return context.pageBuilder.getPageElement(args.id);
                        });
                    },
                    listPageElements: async (_, __, context) => {
                        return resolve(() => {
                            return context.pageBuilder.listPageElements();
                        });
                    }
                },
                PbMutation: {
                    createPageElement: async (_, args: any, context) => {
                        return resolve(() => {
                            return context.pageBuilder.createPageElement(args.data);
                        });
                    },
                    updatePageElement: async (_, args: any, context) => {
                        return resolve(() => {
                            return context.pageBuilder.updatePageElement(args.id, args.data);
                        });
                    },
                    deletePageElement: async (_, args: any, context) => {
                        return resolve(() => {
                            return context.pageBuilder.deletePageElement(args.id);
                        });
                    }
                }
            }
        }
    };
};
