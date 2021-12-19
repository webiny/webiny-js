import { createMenuCrud } from "./crud/menus.crud";
import { createCategoriesCrud } from "./crud/categories.crud";
import { createPageCrud } from "./crud/pages.crud";
import { createPageValidation } from "./crud/pages.validation";
import { createPageElementsCrud } from "./crud/pageElements.crud";
import { createSettingsCrud } from "./crud/settings.crud";
import { createSystemCrud } from "./crud/system.crud";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { PbContext } from "~/graphql/types";
import WebinyError from "@webiny/error";
import { JsonpackContentCompressionPlugin } from "~/plugins/JsonpackContentCompressionPlugin";
import { createTopic } from "@webiny/pubsub";
import { createStorageOperations } from "~/graphql/crud/storageOperations";
import {
    CategoryStorageOperations,
    MenuStorageOperations,
    PageElementStorageOperations,
    PageStorageOperations,
    SettingsStorageOperations,
    SystemStorageOperations
} from "~/types";
import { SystemStorageOperationsProviderPlugin } from "~/plugins/SystemStorageOperationsProviderPlugin";
import { SettingsStorageOperationsProviderPlugin } from "~/plugins/SettingsStorageOperationsProviderPlugin";
import { MenuStorageOperationsProviderPlugin } from "~/plugins/MenuStorageOperationsProviderPlugin";
import { PageElementStorageOperationsProviderPlugin } from "~/plugins/PageElementStorageOperationsProviderPlugin";
import { PageStorageOperationsProviderPlugin } from "~/plugins/PageStorageOperationsProviderPlugin";
import { CategoryStorageOperationsProviderPlugin } from "~/plugins/CategoryStorageOperationsProviderPlugin";

// This setup (using the `createPageBuilder` factory function) is just a starting point.
// The rest of the Page Builder application should be rewritten and use the same approach as well.
// Ultimately, this `createPageBuilder` factory function should be located in package root.
// So, for example: `packages/api-page-builder/src/createPageBuilder.ts`.
const createPageBuilder = () => {
    let prerenderingHandlers = {
        render: async () => {
            // empty
        },
        flush: async () => {
            // empty
        }
    };

    return {
        onPageBeforeRender: createTopic("pageBuilder.onBeforeRenderPage"),
        onPageAfterRender: createTopic("pageBuilder.onAfterRenderPage"),
        onPageBeforeFlush: createTopic("pageBuilder.onBeforeFlushPage"),
        onPageAfterFlush: createTopic("pageBuilder.onAfterFlushPage"),
        setPrerenderingHandlers: handlers => {
            prerenderingHandlers = handlers;
        },
        getPrerenderingHandlers: () => prerenderingHandlers
    };
};

const setup = () => {
    return new ContextPlugin<PbContext>(async context => {
        if (context.pageBuilder) {
            throw new WebinyError("PbContext setup must be first loaded.", "CONTEXT_SETUP_ERROR");
        }

        const systemStorageOperations = await createStorageOperations<SystemStorageOperations>(
            context,
            SystemStorageOperationsProviderPlugin.type
        );

        const system = await createSystemCrud({
            context,
            storageOperations: systemStorageOperations
        });

        const settingsStorageOperations = await createStorageOperations<SettingsStorageOperations>(
            context,
            SettingsStorageOperationsProviderPlugin.type
        );

        const settings = createSettingsCrud({
            context,
            storageOperations: settingsStorageOperations
        });

        const menusStorageOperations = await createStorageOperations<MenuStorageOperations>(
            context,
            MenuStorageOperationsProviderPlugin.type
        );

        const menus = createMenuCrud({
            context,
            storageOperations: menusStorageOperations
        });

        const categoriesStorageOperations =
            await createStorageOperations<CategoryStorageOperations>(
                context,
                CategoryStorageOperationsProviderPlugin.type
            );

        const categories = createCategoriesCrud({
            context,
            storageOperations: categoriesStorageOperations
        });

        const pageElementsStorageOperations =
            await createStorageOperations<PageElementStorageOperations>(
                context,
                PageElementStorageOperationsProviderPlugin.type
            );

        const pageElements = createPageElementsCrud({
            context,
            storageOperations: pageElementsStorageOperations
        });

        const pageStorageOperations = await createStorageOperations<PageStorageOperations>(
            context,
            PageStorageOperationsProviderPlugin.type
        );

        const pages = createPageCrud({
            context,
            storageOperations: pageStorageOperations
        });

        context.pageBuilder = {
            ...context.pageBuilder,
            ...createPageBuilder(),
            system,
            settings,
            menus,
            pages,
            pageElements,
            categories
        };
    });
};

export const createCrud = () => {
    return [
        new JsonpackContentCompressionPlugin(),
        setup(),
        /**
         * We must have default compression in the page builder.
         * Maybe figure out some other way of registering the plugins.
         */
        /**
         * Add validation
         */
        createPageValidation()
    ];
};
