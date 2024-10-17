import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";

import resolve from "./utils/resolve";
import { PageTemplate, PbContext } from "~/types";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";

const defaultResolver = <T>(
    name: keyof PageTemplate,
    value: T
): GraphQLFieldResolver<PageTemplate> => {
    return parent => parent[name] || value;
};

export const createPageTemplateGraphQL = new GraphQLSchemaPlugin<PbContext>({
    typeDefs: /* GraphQL */ `
        type PbPageTemplate {
            id: ID!
            title: String!
            slug: String!
            description: String!
            tags: [String!]
            content: JSON!
            createdOn: DateTime!
            savedOn: DateTime!
            createdBy: PbIdentity!
            layout: String
            pageCategory: String
        }

        input PbCreatePageTemplateInput {
            title: String!
            description: String!
            slug: String!
            tags: [String!]
            layout: String
            pageCategory: String
            content: JSON
        }

        input PbUpdatePageTemplateInput {
            title: String
            slug: String
            description: String
            layout: String
            pageCategory: String
            content: JSON
            tags: [String!]
        }

        input PbCreateTemplateFromPageInput {
            title: String!
            slug: String!
            description: String!
        }

        # Response types
        type PbPageTemplateResponse {
            data: PbPageTemplate
            error: PbError
        }

        type PbPageTemplateListResponse {
            data: [PbPageTemplate!]
            error: PbError
        }

        extend type PbQuery {
            listPageTemplates: PbPageTemplateListResponse
            getPageTemplate(id: ID!): PbPageTemplateResponse
        }

        extend type PbMutation {
            createPageTemplate(data: PbCreatePageTemplateInput!): PbPageTemplateResponse
            createPageFromTemplate(templateId: ID, meta: JSON): PbPageResponse
            createTemplateFromPage(
                pageId: ID!
                data: PbCreateTemplateFromPageInput
            ): PbPageTemplateResponse
            updatePageTemplate(id: ID!, data: PbUpdatePageTemplateInput!): PbPageTemplateResponse
            deletePageTemplate(id: ID!): PbPageTemplateResponse
        }
    `,
    resolvers: {
        PbPageTemplate: {
            description: defaultResolver("description", ""),
            slug: defaultResolver("slug", ""),
            tags: defaultResolver("tags", []),
            content: async (pageTemplate: PageTemplate, _, context) => {
                if (!pageTemplate.content?.elements) {
                    return pageTemplate.content || {};
                }

                // Map block references
                const blocks = await context.pageBuilder.resolvePageBlocks(pageTemplate.content);

                return { ...pageTemplate.content, elements: blocks };
            }
        },
        PbQuery: {
            getPageTemplate: async (_, args: any, context) => {
                return resolve(() => {
                    return context.pageBuilder.getPageTemplate({ where: { id: args.id } });
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
            createPageFromTemplate: async (_, { templateId, meta }: any, context) => {
                return resolve(() => {
                    return context.pageBuilder.createPageFromTemplate({
                        id: templateId,
                        meta
                    });
                });
            },
            createTemplateFromPage: async (_, args: any, context) => {
                return resolve(() => {
                    return context.pageBuilder.createTemplateFromPage(args.pageId, args.data);
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
