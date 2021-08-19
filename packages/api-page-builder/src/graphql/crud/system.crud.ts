import WebinyError from "@webiny/error";
import { NotAuthorizedError } from "@webiny/api-security";
import { UpgradePlugin } from "@webiny/api-upgrade/types";
import { getApplicablePlugin } from "@webiny/api-upgrade";
import executeCallbacks from "./utils/executeCallbacks";
import { preparePageData } from "./install/welcome-to-webiny-page-data";
import { notFoundPageData } from "./install/notFoundPageData";
import savePageAssets from "./install/utils/savePageAssets";
import { PbContext, System } from "~/types";
import { InstallationPlugin } from "~/plugins/InstallationPlugin";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { SystemStorageOperationsProviderPlugin } from "~/plugins/SystemStorageOperationsProviderPlugin";

export default new ContextPlugin<PbContext>(async context => {
    /**
     * If pageBuilder is not defined on the context, do not continue, but log it.
     */
    if (!context.pageBuilder) {
        console.log("Missing pageBuilder on context. Skipping System crud.");
        return;
    }
    const pluginType = SystemStorageOperationsProviderPlugin.type;

    const providerPlugin: SystemStorageOperationsProviderPlugin = context.plugins
        .byType<SystemStorageOperationsProviderPlugin>(pluginType)
        .find(() => true);

    if (!providerPlugin) {
        throw new WebinyError(`Missing "${pluginType}" plugin.`, "PLUGIN_NOT_FOUND", {
            type: pluginType
        });
    }

    const storageOperations = await providerPlugin.provide({
        context
    });

    context.pageBuilder.system = {
        async get() {
            try {
                return await storageOperations.get();
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not load system data.",
                    ex.code || "GET_SYSTEM_ERROR"
                );
            }
        },
        async getVersion() {
            const system = await context.pageBuilder.system.get();

            return system ? system.version : null;
        },
        async setVersion(version: string) {
            const original = await context.pageBuilder.system.get();

            if (original) {
                const system = {
                    ...original,
                    version
                };
                try {
                    await storageOperations.update({
                        original,
                        system
                    });
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not update system record.",
                        ex.code || "UPDATE_SYSTEM_ERROR",
                        {
                            system
                        }
                    );
                }
                return;
            }

            const system: System = {
                version
            };
            try {
                await storageOperations.create({
                    system
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create system record.",
                    ex.code || "CREATE_SYSTEM_ERROR",
                    {
                        system
                    }
                );
            }
        },
        async install({ name, insertDemoData }) {
            const { pageBuilder, fileManager } = context;

            // Check whether the PB app is already installed
            const version = await pageBuilder.system.getVersion();
            if (version) {
                throw new WebinyError("Page builder is already installed.", "PB_INSTALL_ABORTED");
            }

            const hookPlugins = context.plugins.byType<InstallationPlugin>(InstallationPlugin.type);
            /**
             * 1. Execute all beforeInstall installation hooks.
             * In old code there was Elasticsearch index creation here and it was moved to the plugin because
             * different storage operations need different things done.
             */
            await executeCallbacks<InstallationPlugin["beforeInstall"]>(
                hookPlugins,
                "beforeInstall",
                {
                    context
                }
            );

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
                        content: welcomeToWebinyPageContent,
                        settings: {}
                    },
                    {
                        title: "Not Found",
                        path: "/not-found",
                        content: notFoundPageData,
                        settings: {},
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

                await pageBuilder.settings.update({
                    name: name,
                    pages: {
                        home: homePage.pid,
                        notFound: notFoundPage.pid
                    }
                });
            }

            // 6. Mark the Page Builder app as installed.
            await context.pageBuilder.system.setVersion(context.WEBINY_VERSION);

            await executeCallbacks<InstallationPlugin["afterInstall"]>(
                hookPlugins,
                "afterInstall",
                {
                    context
                }
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
                installedAppVersion: await context.pageBuilder.system.getVersion(),
                upgradePlugins,
                upgradeToVersion: version
            });

            await plugin.apply(context);

            // Store new app version
            await context.pageBuilder.system.setVersion(version);

            return true;
        }
    };
});
