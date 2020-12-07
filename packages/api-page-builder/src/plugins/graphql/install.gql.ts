import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { Response } from "@webiny/handler-graphql/responses";
import { PbContext } from "@webiny/api-page-builder/types";

const plugin: GraphQLSchemaPlugin<PbContext> = {
    type: "graphql-schema",
    schema: {
        typeDefs: /* GraphQL */ `
            input PbInstallInput {
                domain: String
                name: String!
            }
            type PbInstallResponse {
                data: Boolean
                error: PbError
            }

            extend type PbQuery {
                # Is Page Builder installed?
                isInstalled: PbInstallResponse
            }

            extend type PbMutation {
                # Install Page Builder (there are x steps because the process takes a long time).
                install(data: PbInstallInput!): PbInstallResponse
            }
        `,
        resolvers: {
            PbQuery: {
                isInstalled: async (_, args, context) => {
                    const { i18nContent, security } = context;
                    if (!security.getTenant() || !i18nContent.getLocale()) {
                        return false;
                    }

                    const settings = await context.pageBuilder.settings.get({
                        auth: false
                    });
                    return new Response(settings.installed);
                }
            },
            PbMutation: {
                install: async (_, args, context) => {
                    // 1. Create initial page category.
                    const staticCategory = await context.pageBuilder.categories.get("static");
                    if (!staticCategory) {
                        await context.pageBuilder.categories.create({
                            name: "Static",
                            slug: "static",
                            url: "/static/",
                            layout: "static"
                        });
                    }

                    // 2. Create page blocks.

                    // 3. Create initial menu.

                    // 4. Create sample pages.

                    // 5. Mark the Page Builder app as installed.
                    const settings = await context.pageBuilder.settings.get();
                    if (!settings.installed) {
                        await context.pageBuilder.settings.update({
                            installed: true
                        });
                    }

                    return new Response(true);
                }
            }
        }
    }
};

export default plugin;
