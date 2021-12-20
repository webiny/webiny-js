import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { PbContext } from "../../types";
import resolve from "./utils/resolve";

const plugin: GraphQLSchemaPlugin<PbContext> = {
    type: "graphql-schema",
    schema: {
        typeDefs: /* GraphQL */ `
            type PbMenu {
                id: ID
                createdOn: DateTime
                createdBy: PbCreatedBy
                title: String
                slug: String
                description: String
                items: [JSON]
            }

            input PbMenuInput {
                id: ID
                title: String!
                slug: String!
                description: String
                items: [JSON]
            }

            # Response types
            type PbMenuResponse {
                data: PbMenu
                error: PbError
            }

            type PbMenuListResponse {
                data: [PbMenu]
                error: PbError
            }

            extend type PbQuery {
                getMenu(slug: String!): PbMenuResponse
                getPublicMenu(slug: String!): PbMenuResponse
                listMenus: PbMenuListResponse

                "Returns menu by given slug."
                getMenuBySlug(slug: String!): PbMenuResponse
            }

            extend type PbMutation {
                createMenu(data: PbMenuInput!): PbMenuResponse
                updateMenu(slug: String!, data: PbMenuInput!): PbMenuResponse
                deleteMenu(slug: String!): PbMenuResponse
            }
        `,
        resolvers: {
            PbQuery: {
                getMenu: async (_, args: { slug: string }, context) => {
                    return resolve(() => {
                        return context.pageBuilder.getMenu(args.slug);
                    });
                },
                getPublicMenu: async (_, args: { slug: string }, context) => {
                    return resolve(() => {
                        return context.pageBuilder.getPublicMenu(args.slug);
                    });
                },
                listMenus: async (_, __, context) => {
                    return resolve(() => {
                        return context.pageBuilder.listMenus();
                    });
                }
            },
            PbMutation: {
                createMenu: async (_, args: { data: Record<string, any> }, context) => {
                    return resolve(() => {
                        return context.pageBuilder.createMenu(args.data);
                    });
                },
                updateMenu: async (
                    _,
                    args: { slug: string; data: Record<string, any> },
                    context
                ) => {
                    return resolve(() => {
                        return context.pageBuilder.updateMenu(args.slug, args.data);
                    });
                },
                deleteMenu: async (_, args: { slug: string }, context) => {
                    return resolve(() => {
                        return context.pageBuilder.deleteMenu(args.slug);
                    });
                }
            }
        }
    }
};

export default plugin;
