import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import resolve from "./utils/resolve";
import { PbContext } from "../types";

const plugin: GraphQLSchemaPlugin<PbContext> = {
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

            input PbPageElementInput {
                id: ID
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
                createPageElement(data: PbPageElementInput!): PbPageElementResponse
                updatePageElement(id: ID!, data: PbPageElementInput!): PbPageElementResponse
                deletePageElement(id: ID!): PbPageElementResponse
            }
        `,
        resolvers: {
            PbQuery: {
                getPageElement: async (_, args: { id: string }, context) => {
                    return resolve(() => {
                        return context.pageBuilder.pageElements.getPageElement(args.id);
                    });
                },
                listPageElements: async (_, __, context) => {
                    return resolve(() => {
                        return context.pageBuilder.pageElements.listPageElements();
                    });
                }
            },
            PbMutation: {
                createPageElement: async (_, args: { data: Record<string, any> }, context) => {
                    return resolve(() => {
                        return context.pageBuilder.pageElements.createPageElement(args.data);
                    });
                },
                updatePageElement: async (
                    _,
                    args: { id: string; data: Record<string, any> },
                    context
                ) => {
                    return resolve(() => {
                        return context.pageBuilder.pageElements.updatePageElement(
                            args.id,
                            args.data
                        );
                    });
                },
                deletePageElement: async (_, args: { id: string }, context) => {
                    return resolve(() => {
                        return context.pageBuilder.pageElements.deletePageElement(args.id);
                    });
                }
            }
        }
    }
};

export default plugin;
