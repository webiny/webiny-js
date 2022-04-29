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

export interface CreateCrudParams {
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

const setup = (params: CreateCrudParams) => {
    const { storageOperations } = params;
    return new ContextPlugin<PbContext>(async context => {
        if (context.pageBuilder) {
            throw new WebinyError("PbContext setup must be first loaded.", "CONTEXT_SETUP_ERROR");
        }

        const getTenantId = (): string => {
            return context.tenancy.getCurrentTenant().id;
        };

        const getLocaleCode = (): string => {
            const locale = context.i18n.getContentLocale();
            if (!locale) {
                throw new WebinyError("Missing content locale in API Page Builder.");
            }
            return locale.code;
        };

        if (storageOperations.beforeInit) {
            try {
                await storageOperations.beforeInit(context);
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not run before init in Page Builder storage operations.",
                    ex.code || "STORAGE_OPERATIONS_BEFORE_INIT_ERROR",
                    {
                        ...ex
                    }
                );
            }
        }

        const system = await createSystemCrud({
            context,
            storageOperations,
            getTenantId
        });

        const settings = createSettingsCrud({
            context,
            storageOperations,
            getTenantId,
            getLocaleCode
        });

        const menus = createMenuCrud({
            context,
            storageOperations,
            getTenantId,
            getLocaleCode
        });

        const categories = createCategoriesCrud({
            context,
            storageOperations,
            getTenantId,
            getLocaleCode
        });

        const pageElements = createPageElementsCrud({
            context,
            storageOperations,
            getTenantId,
            getLocaleCode
        });

        const pages = createPageCrud({
            context,
            storageOperations,
            getTenantId,
            getLocaleCode
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

        if (!storageOperations.init) {
            return;
        }
        try {
            await storageOperations.init(context);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not run init in Page Builder storage operations.",
                ex.code || "STORAGE_OPERATIONS_INIT_ERROR",
                {
                    ...ex
                }
            );
        }
    });
};

export const createCrud = (params: CreateCrudParams) => {
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
