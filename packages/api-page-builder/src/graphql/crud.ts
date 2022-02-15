import { createMenuCrud } from "./crud/menus.crud";
import { createCategoriesCrud } from "./crud/categories.crud";
import { createPageCrud } from "./crud/pages.crud";
import { createPageValidation } from "./crud/pages.validation";
import { createPageElementsCrud } from "./crud/pageElements.crud";
import { createSettingsCrud } from "./crud/settings.crud";
import { createSystemCrud } from "./crud/system.crud";
import { ContextPlugin } from "@webiny/handler";
import { PbContext, PrerenderingHandlers } from "~/graphql/types";
import { JsonpackContentCompressionPlugin } from "~/plugins/JsonpackContentCompressionPlugin";
import { createTopic } from "@webiny/pubsub";
import { PageBuilderStorageOperations } from "~/types";
import WebinyError from "@webiny/error";

export interface Params {
    storageOperations: PageBuilderStorageOperations;
}

// This setup (using the `createPageBuilder` factory function) is just a starting point.
// The rest of the Page Builder application should be rewritten and use the same approach as well.
// Ultimately, this `createPageBuilder` factory function should be located in package root.
// So, for example: `packages/api-page-builder/src/createPageBuilder.ts`.
const createPageBuilder = () => {
    let prerenderingHandlers: PrerenderingHandlers = {
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
        setPrerenderingHandlers: (handlers: PrerenderingHandlers) => {
            prerenderingHandlers = handlers;
        },
        getPrerenderingHandlers: () => prerenderingHandlers
    };
};

const setup = (params: Params) => {
    const { storageOperations } = params;
    return new ContextPlugin<PbContext>(async context => {
        if (context.pageBuilder) {
            throw new WebinyError("PbContext setup must be first loaded.", "CONTEXT_SETUP_ERROR");
        }
        const system = await createSystemCrud({
            context,
            storageOperations
        });

        const settings = createSettingsCrud({
            context,
            storageOperations
        });

        const menus = createMenuCrud({
            context,
            storageOperations
        });

        const categories = createCategoriesCrud({
            context,
            storageOperations
        });

        const pageElements = createPageElementsCrud({
            context,
            storageOperations
        });

        const pages = createPageCrud({
            context,
            storageOperations
        });

        context.pageBuilder = {
            ...createPageBuilder(),
            ...system,
            ...settings,
            ...menus,
            ...pages,
            ...pageElements,
            ...categories
        };
    });
};

export const createCrud = (params: Params) => {
    return [
        new JsonpackContentCompressionPlugin(),
        setup(params),
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
