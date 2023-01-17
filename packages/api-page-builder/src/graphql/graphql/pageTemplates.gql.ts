import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";

import resolve from "./utils/resolve";
import { PageTemplate, PbContext } from "~/types";

export const createPageTemplateGraphQL = new GraphQLSchemaPlugin<PbContext>({
    typeDefs: /* GraphQL */ `
        type PbPageTemplate {
            id: ID
            title: String
            description: String
            content: JSON
            createdOn: DateTime
            savedOn: DateTime
            createdBy: PbCreatedBy
        }

        input PbCreatePageTemplateInput {
            title: String!
            description: String
            content: JSON
        }

        input PbUpdatePageTemplateInput {
            title: String
            description: String
            content: JSON
        }

        # Response types
        type PbPageTemplateResponse {
            data: PbPageTemplate
            error: PbError
        }

        type PbPageTemplateListResponse {
            data: [PbPageTemplate]
            error: PbError
        }

        extend type PbQuery {
            listPageTemplates: PbPageTemplateListResponse
            getPageTemplate(id: ID!): PbPageTemplateResponse
        }

        extend type PbMutation {
            createPageTemplate(data: PbCreatePageTemplateInput!): PbPageTemplateResponse
            updatePageTemplate(id: ID!, data: PbUpdatePageTemplateInput!): PbPageTemplateResponse
            deletePageTemplate(id: ID!): PbPageTemplateResponse
        }
    `,
    resolvers: {
        PbPageTemplate: {
            content: async (pageTemplate: PageTemplate, _, context) => {
                if (!pageTemplate.content?.elements) {
                    return pageTemplate.content;
                }

                // Map block references
                const blocks = await context.pageBuilder.resolvePageBlocks(pageTemplate.content);

                return { ...pageTemplate.content, elements: blocks };
            }
        },
        PbQuery: {
            getPageTemplate: async (_, args: any, context) => {
                return resolve(() => {
                    return context.pageBuilder.getPageTemplate(args.id);
                });
            },
            listPageTemplates: async (_, args: any, context) => {
                return resolve(() => {
                    return context.pageBuilder.listPageTemplates(args);
                });
            }
        },
        PbMutation: {
            createPageTemplate: async (_, args: any, context) => {
                return resolve(() => {
                    return context.pageBuilder.createPageTemplate(args.data);
                });
            },
            updatePageTemplate: async (_, args: any, context) => {
                return resolve(() => {
                    return context.pageBuilder.updatePageTemplate(args.id, args.data);
                });
            },
            deletePageTemplate: async (_, args: any, context) => {
                return resolve(() => {
                    return context.pageBuilder.deletePageTemplate(args.id);
                });
            }
        }
    }
});
