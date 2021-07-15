import Error from "@webiny/error";
import { NotAuthorizedError } from "@webiny/api-security";
import { UpgradePlugin } from "@webiny/api-upgrade/types";
import { getApplicablePlugin } from "@webiny/api-upgrade";
import executeCallbacks from "./utils/executeCallbacks";
import { preparePageData } from "./install/welcome-to-webiny-page-data";
import { notFoundPageData } from "./install/notFoundPageData";
import savePageAssets from "./install/utils/savePageAssets";
import defaults from "./utils/defaults";
import { PbContext } from "~/types";
import { InstallationPlugin } from "~/plugins/InstallationPlugin";

export default {
    type: "context",
    apply(context: PbContext) {
        const { tenancy, db } = context;
        const keys = () => ({ PK: `T#${tenancy.getCurrentTenant().id}#SYSTEM`, SK: "PB" });

        context.pageBuilder = {
            ...context.pageBuilder,
            system: {
                async getVersion() {
                    const [[system]] = await db.read({
                        ...defaults.db,
                        query: keys()
                    });

                    return system ? system.version : null;
                },
                async setVersion(version: string) {
                    const [[system]] = await db.read({
                        ...defaults.db,
                        query: keys()
                    });

                    if (system) {
                        await db.update({
                            ...defaults.db,
                            query: keys(),
                            data: {
                                version
                            }
                        });
                    } else {
                        await db.create({
                            ...defaults.db,
                            data: {
                                ...keys(),
                                version
                            }
                        });
                    }
                },
                async install({ name, insertDemoData }) {
                    const { pageBuilder, fileManager, elasticsearch } = context;

                    const hookPlugins = context.plugins.byType<InstallationPlugin>(
                        InstallationPlugin.type
                    );
                    await executeCallbacks<InstallationPlugin["beforeInstall"]>(
                        hookPlugins,
                        "beforeInstall",
                        { context }
                    );

                    // Check whether the PB app is already installed
                    const version = await pageBuilder.system.getVersion();
                    if (version) {
                        throw new Error("Page builder is already installed.", "PB_INSTALL_ABORTED");
                    }

                    // 1. Create ES index if it doesn't already exist.
                    const { index } = defaults.es(context);
                    const { body: exists } = await elasticsearch.indices.exists({ index });
                    if (!exists) {
                        await elasticsearch.indices.create({
                            index,
                            body: {
                                // need this part for sorting to work on text fields
                                settings: {
                                    analysis: {
                                        analyzer: {
                                            lowercase_analyzer: {
                                                type: "custom",
                                                filter: ["lowercase", "trim"],
                                                tokenizer: "keyword"
                                            }
                                        }
                                    }
                                },
                                mappings: {
                                    properties: {
                                        property: {
                                            type: "text",
                                            fields: {
                                                keyword: {
                                                    type: "keyword",
                                                    ignore_above: 256
                                                }
                                            },
                                            analyzer: "lowercase_analyzer"
                                        }
                                    }
                                }
                            }
                        });
                    }

                    if (insertDemoData) {
                        // 2. Create initial page category.
                        let staticCategory = await pageBuilder.categories.get("static");
                        if (!staticCategory) {
                            staticCategory = await pageBuilder.categories.create({
                                name: "Static",
                                slug: "static",
                                url: "/static/",
                                layout: "static"
                            });
                            pageBuilder.categories.dataLoaders.get.clearAll();
                        }

                        // 3. Create page blocks.

                        // Upload page data images
                        const fileIdToKeyMap = await savePageAssets({ context });

                        // 4. Create initial menu.
                        const mainMenu = await pageBuilder.menus.get("main-menu");
                        if (!mainMenu) {
                            await pageBuilder.menus.create({
                                title: "Main Menu",
                                slug: "main-menu",
                                description:
                                    "The main menu of the website, containing links to most important pages."
                            });
                        }

                        // 5. Create sample pages.
                        const { pages } = pageBuilder;
                        const fmSettings = await fileManager.settings.getSettings();

                        const welcomeToWebinyPageContent = preparePageData({
                            srcPrefix: fmSettings && fmSettings.srcPrefix,
                            fileIdToKeyMap
                        });

                        const initialPages = [
                            {
                                title: "Welcome to Webiny",
                                path: "/welcome-to-webiny",
                                content: welcomeToWebinyPageContent
                            },
                            {
                                title: "Not Found",
                                path: "/not-found",
                                content: notFoundPageData,
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

                        await pageBuilder.settings.default.update({
                            name: name,
                            pages: {
                                home: homePage.pid,
                                notFound: notFoundPage.pid
                            }
                        });
                    }

                    // 6. Mark the Page Builder app as installed.
                    await this.setVersion(context.WEBINY_VERSION);

                    await executeCallbacks<InstallationPlugin["afterInstall"]>(
                        hookPlugins,
                        "afterInstall",
                        { context }
                    );
                },
                async upgrade(version) {
                    const identity = context.security.getIdentity();
                    if (!identity) {
                        throw new NotAuthorizedError();
                    }

                    const upgradePlugins = context.plugins
                        .byType<UpgradePlugin>("api-upgrade")
                        .filter(pl => pl.app === "page-builder");

                    const plugin = getApplicablePlugin({
                        deployedVersion: context.WEBINY_VERSION,
                        installedAppVersion: await this.getVersion(),
                        upgradePlugins,
                        upgradeToVersion: version
                    });

                    await plugin.apply(context);

                    // Store new app version
                    await this.setVersion(version);

                    return true;
                }
            }
        };
    }
};
