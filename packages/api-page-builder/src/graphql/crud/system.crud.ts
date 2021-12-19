import WebinyError from "@webiny/error";
import { NotAuthorizedError } from "@webiny/api-security";
import { UpgradePlugin } from "@webiny/api-upgrade/types";
import { getApplicablePlugin } from "@webiny/api-upgrade";
import { preparePageData } from "./install/welcome-to-webiny-page-data";
import { notFoundPageData } from "./install/notFoundPageData";
import savePageAssets from "./install/utils/savePageAssets";
import {
    OnAfterInstallTopicParams,
    OnBeforeInstallTopicParams,
    PbContext,
    System,
    SystemCrud,
    SystemStorageOperations
} from "~/types";
import { createTopic } from "@webiny/pubsub";

export interface Params {
    context: PbContext;
    storageOperations: SystemStorageOperations;
}
export const createSystemCrud = (params: Params): SystemCrud => {
    const { context, storageOperations } = params;

    const getTenantId = (): string => {
        return context.tenancy.getCurrentTenant().id;
    };

    const onBeforeInstall = createTopic<OnBeforeInstallTopicParams>();
    const onAfterInstall = createTopic<OnAfterInstallTopicParams>();

    return {
        onBeforeInstall,
        onAfterInstall,
        async getSystem() {
            try {
                return await storageOperations.get();
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not load system data.",
                    ex.code || "GET_SYSTEM_ERROR"
                );
            }
        },
        async getSystemVersion() {
            const system = await context.pageBuilder.system.getSystem();

            return system ? system.version : null;
        },
        async setSystemVersion(version: string) {
            const original = await context.pageBuilder.system.getSystem();

            if (original) {
                const system = {
                    ...original,
                    tenant: original.tenant || getTenantId(),
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
                version,
                tenant: getTenantId()
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
        async installSystem({ name, insertDemoData }) {
            const { pageBuilder, fileManager } = context;

            // Check whether the PB app is already installed
            const version = await pageBuilder.system.getSystemVersion();
            if (version) {
                throw new WebinyError("Page builder is already installed.", "PB_INSTALL_ABORTED");
            }

            /**
             * 1. Execute all beforeInstall installation hooks.
             */
            await onBeforeInstall.publish({
                context
            });

            if (insertDemoData) {
                // 2. Create initial page category.
                let staticCategory = await pageBuilder.categories.getCategory("static");
                if (!staticCategory) {
                    staticCategory = await pageBuilder.categories.createCategory({
                        name: "Static",
                        slug: "static",
                        url: "/static/",
                        layout: "static"
                    });
                }

                // 3. Create page blocks.

                // Upload page data images
                const fileIdToFileMap = await savePageAssets({ context });

                // 4. Create initial menu.
                const mainMenu = await pageBuilder.menus.getMenu("main-menu");
                if (!mainMenu) {
                    await pageBuilder.menus.createMenu({
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
                    fileIdToFileMap: fileIdToFileMap
                });

                const initialPagesData = [
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

                const initialPages = await Promise.all(
                    initialPagesData.map(() => pages.createPage(staticCategory.slug))
                );
                const updatedPages = await Promise.all(
                    initialPagesData.map((data, index) => {
                        return pages.updatePage(initialPages[index].id, data);
                    })
                );
                const [homePage, notFoundPage] = await Promise.all(
                    updatedPages.map(page => pages.publishPage(page.id))
                );

                await pageBuilder.settings.updateSettings({
                    name: name,
                    pages: {
                        home: homePage.pid,
                        notFound: notFoundPage.pid
                    }
                });
            }

            // 6. Mark the Page Builder app as installed.
            await context.pageBuilder.system.setSystemVersion(context.WEBINY_VERSION);

            await onAfterInstall.publish({
                context
            });
        },
        async upgradeSystem(version) {
            const identity = context.security.getIdentity();
            if (!identity) {
                throw new NotAuthorizedError();
            }

            const upgradePlugins = context.plugins
                .byType<UpgradePlugin>("api-upgrade")
                .filter(pl => pl.app === "page-builder");

            const plugin = getApplicablePlugin({
                deployedVersion: context.WEBINY_VERSION,
                installedAppVersion: await context.pageBuilder.system.getSystemVersion(),
                upgradePlugins,
                upgradeToVersion: version
            });

            await plugin.apply(context);

            // Store new app version
            await context.pageBuilder.system.setSystemVersion(version);

            return true;
        }
    };
};
