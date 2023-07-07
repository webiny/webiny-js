import WebinyError from "@webiny/error";
import { NotAuthorizedError } from "@webiny/api-security";
import { preparePageData } from "./install/welcomeToWebinyPageData";
import { notFoundPageData } from "./install/notFoundPageData";
import { savePageAssets } from "./install/utils/savePageAssets";
import {
    Category,
    OnSystemAfterInstallTopicParams,
    OnSystemBeforeInstallTopicParams,
    Page,
    PageBuilderContextObject,
    PageBuilderStorageOperations,
    PbContext,
    System,
    SystemCrud
} from "~/types";
import { createTopic } from "@webiny/pubsub";

export interface CreateSystemCrudParams {
    context: PbContext;
    storageOperations: PageBuilderStorageOperations;
    getTenantId: () => string;
}

export const createSystemCrud = (params: CreateSystemCrudParams): SystemCrud => {
    const { context, storageOperations, getTenantId } = params;
    const onSystemBeforeInstall = createTopic<OnSystemBeforeInstallTopicParams>(
        "pageBuilder.onSystemBeforeInstall"
    );
    const onSystemAfterInstall = createTopic<OnSystemAfterInstallTopicParams>(
        "pageBuilder.onSystemAfterInstall"
    );

    return {
        /**
         * Lifecycle events - deprecated in 5.34.0 - will be removed in 5.36.0
         */
        onBeforeInstall: onSystemBeforeInstall,
        onAfterInstall: onSystemAfterInstall,
        /**
         * Introduced in 5.34.0
         */
        onSystemBeforeInstall,
        onSystemAfterInstall,
        async getSystem() {
            try {
                return await storageOperations.system.get({
                    tenant: getTenantId()
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not load system data.",
                    ex.code || "GET_SYSTEM_ERROR"
                );
            }
        },
        async getSystemVersion(this: PageBuilderContextObject) {
            const system = await this.getSystem();

            return system ? system.version : null;
        },
        async setSystemVersion(this: PageBuilderContextObject, version: string) {
            const original = await this.getSystem();

            if (original) {
                const system = {
                    ...original,
                    tenant: original.tenant || getTenantId(),
                    version
                };
                try {
                    await storageOperations.system.update({
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
                await storageOperations.system.create({
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
        async installSystem(this: PageBuilderContextObject, { name, insertDemoData }) {
            const identity = context.security.getIdentity();
            if (!identity) {
                throw new NotAuthorizedError();
            }

            const { fileManager } = context;

            // Check whether the PB app is already installed
            const version = await this.getSystemVersion();
            if (version) {
                throw new WebinyError("Page builder is already installed.", "PB_INSTALL_ABORTED");
            }

            /**
             * 1. Execute all beforeInstall installation hooks.
             */
            await onSystemBeforeInstall.publish({
                tenant: getTenantId()
            });

            if (insertDemoData) {
                // 2. Create initial page category.
                let staticCategory = await this.getCategory("static");
                if (!staticCategory) {
                    staticCategory = await this.createCategory({
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
                const mainMenu = await this.getMenu("main-menu");
                if (!mainMenu) {
                    await this.createMenu({
                        title: "Main Menu",
                        slug: "main-menu",
                        description:
                            "The main menu of the website, containing links to most important pages.",
                        items: []
                    });
                }

                // 5. Create sample pages.
                const fmSettings = await fileManager.getSettings();

                const welcomeToWebinyPageContent = preparePageData({
                    srcPrefix: fmSettings ? fmSettings.srcPrefix : "",
                    fileIdToFileMap: fileIdToFileMap
                });

                const notFoundPageContent = notFoundPageData;

                const initialPagesData: Page[] = [
                    /**
                     * Category is missing, but we cannot set it because it will override the created one.
                     */
                    // @ts-ignore
                    {
                        title: "Not Found",
                        path: "/not-found",
                        content: notFoundPageContent,
                        settings: {}
                    },
                    /**
                     * Category is missing, but we cannot set it because it will override the created one.
                     */
                    // @ts-ignore
                    {
                        title: "Welcome to Webiny",
                        path: "/welcome-to-webiny",
                        content: welcomeToWebinyPageContent,
                        settings: {}
                    }
                ];

                const initialPages = await Promise.all(
                    // We can safely cast.
                    initialPagesData.map(() => this.createPage((staticCategory as Category).slug))
                );

                const updatedPages = await Promise.all(
                    initialPagesData.map((data, index) => {
                        return this.updatePage(initialPages[index].id, data);
                    })
                );
                const [notFoundPage, homePage] = await Promise.all(
                    updatedPages.map(page => this.publishPage(page.id))
                );

                await this.updateSettings({
                    name: name,
                    pages: {
                        home: homePage.pid,
                        notFound: notFoundPage.pid
                    }
                });
            }

            // 6. Mark the Page Builder app as installed.
            await this.setSystemVersion(context.WEBINY_VERSION);

            await onSystemAfterInstall.publish({
                tenant: getTenantId()
            });
        }
    };
};
