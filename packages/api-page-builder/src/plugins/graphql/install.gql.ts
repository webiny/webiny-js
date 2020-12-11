import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { Response } from "@webiny/handler-graphql/responses";
import { PbContext } from "@webiny/api-page-builder/types";
import defaults from "./../crud/utils/defaults";

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
                    // 1. Create ES index if it doesn't already exist.
                    const { index } = defaults.es(context);
                    const { body: exists } = await context.elasticSearch.indices.exists({ index });
                    if (!exists) {
                        await context.elasticSearch.indices.create({
                            index
                        });
                    }

                    // 2. Create initial page category.
                    const staticCategory = await context.pageBuilder.categories.get("static");
                    if (!staticCategory) {
                        await context.pageBuilder.categories.create({
                            name: "Static",
                            slug: "static",
                            url: "/static/",
                            layout: "static"
                        });
                    }

                    // 3. Create page blocks.

                    // 4. Create initial menu.

                    // 5. Create sample pages.

                    // 6. Mark the Page Builder app as installed.
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
