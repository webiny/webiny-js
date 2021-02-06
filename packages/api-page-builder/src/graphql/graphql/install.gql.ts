import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { Response } from "@webiny/handler-graphql/responses";
import { InstallHookPlugin, PbContext } from "@webiny/api-page-builder/types";
import defaults from "./../crud/utils/defaults";
import executeHookCallbacks from "./../crud/utils/executeHookCallbacks";

const plugin: GraphQLSchemaPlugin<PbContext> = {
    type: "graphql-schema",
    schema: {
        typeDefs: /* GraphQL */ `
            input PbInstallInput {
                websiteUrl: String
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
                    const { security } = context;
                    if (!security.getTenant()) {
                        return false;
                    }

                    const settings = await context.pageBuilder.settings.install.get();
                    const isInstalled = Boolean(settings?.installed);
                    return new Response(isInstalled);
                }
            },
            PbMutation: {
                install: async (_, args, context) => {
                    const hookPlugins = context.plugins.byType<InstallHookPlugin>("pb-page-hooks");
                    await executeHookCallbacks(hookPlugins, "beforeInstall", context);

                    // 1. Create ES index if it doesn't already exist.
                    const { index } = defaults.es(context);
                    const { body: exists } = await context.elasticSearch.indices.exists({ index });
                    if (!exists) {
                        await context.elasticSearch.indices.create({
                            index
                        });
                    }

                    // 2. Create initial page category.
                    let staticCategory = await context.pageBuilder.categories.get("static");
                    if (!staticCategory) {
                        staticCategory = await context.pageBuilder.categories.create({
                            name: "Static",
                            slug: "static",
                            url: "/static/",
                            layout: "static"
                        });
                        context.pageBuilder.categories.dataLoaders.get.clearAll();
                    }

                    // 3. Create page blocks.

                    // 4. Create initial menu.
                    const mainMenu = await context.pageBuilder.menus.get("main-menu");
                    if (!mainMenu) {
                        await context.pageBuilder.menus.create({
                            title: "Main Menu",
                            slug: "main-menu",
                            description:
                                "The main menu of the website, containing links to most important pages."
                        });
                    }

                    // 5. Create sample pages.
                    const { pages } = context.pageBuilder;

                    const initialPages = [
                        { title: "Welcome to Webiny", path: "/welcome-to-webiny" },
                        {
                            title: "Not Found",
                            path: "/not-found",
                            // Do not show the page in page lists, only direct get is possible.
                            visibility: {
                                get: { latest: true, published: true },
                                list: { latest: false, published: false }
                            }
                        }
                    ];

                    const [homePage, notFoundPage] = await Promise.all(
                        initialPages.map(data =>
                            pages
                                .create(staticCategory.slug)
                                .then(page => pages.update(page.id, data))
                                .then(page => pages.publish(page.id))
                        )
                    );

                    await context.pageBuilder.settings.default.update({
                        pages: {
                            home: homePage.pid,
                            notFound: notFoundPage.pid
                        }
                    });

                    // 6. Mark the Page Builder app as installed.
                    const settings = await context.pageBuilder.settings.install.get();
                    if (!settings?.installed) {
                        await context.pageBuilder.settings.install.update({
                            installed: true
                        });
                    }

                    await executeHookCallbacks(hookPlugins, "afterInstall", context);

                    return new Response(true);
                }
            }
        }
    }
};

export default plugin;
