import { createMenuCrud } from "./crud/menus.crud";
import { createBlockCategoriesCrud } from "./crud/blockCategories.crud";
import { createPageBlocksCrud } from "./crud/pageBlocks.crud";
import { createPageTemplatesCrud } from "./crud/pageTemplates.crud";
import { createCategoriesCrud } from "./crud/categories.crud";
import { createPageCrud } from "./crud/pages.crud";
import { createPageValidation } from "./crud/pages.validation";
import { createPageElementsCrud } from "./crud/pageElements.crud";
import { createSettingsCrud } from "./crud/settings.crud";
import { createSystemCrud } from "./crud/system.crud";
import { ContextPlugin } from "@webiny/api";
import { PbContext, PrerenderingHandlers } from "~/graphql/types";
import { createTopic } from "@webiny/pubsub";
import { PageBuilderStorageOperations } from "~/types";
import WebinyError from "@webiny/error";
import { PagesPermissions } from "~/graphql/crud/permissions/PagesPermissions";
import { MenusPermissions } from "~/graphql/crud/permissions/MenusPermissions";
import { CategoriesPermissions } from "./crud/permissions/CategoriesPermissions";
import { BlockCategoriesPermissions } from "./crud/permissions/BlockCategoriesPermissions";
import { PageTemplatesPermissions } from "~/graphql/crud/permissions/PageTemplatesPermissions";
import { PageBlocksPermissions } from "~/graphql/crud/permissions/PageBlocksPermissions";
import { GzipContentCompressionPlugin, JsonpackContentCompressionPlugin } from "~/plugins";

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
        onPageBeforeRender: createTopic("pageBuilder.onPageBeforeRender"),
        onPageAfterRender: createTopic("pageBuilder.onPageAfterRender"),
        onPageBeforeFlush: createTopic("pageBuilder.onPageBeforeFlush"),
        onPageAfterFlush: createTopic("pageBuilder.onPageAfterFlush"),
        setPrerenderingHandlers: (handlers: PrerenderingHandlers) => {
            prerenderingHandlers = handlers;
        },
        getPrerenderingHandlers: () => prerenderingHandlers
    };
};

const setup = (params: CreateCrudParams) => {
    const { storageOperations } = params;
    const plugin = new ContextPlugin<PbContext>(async context => {
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

        const menusPermissions = new MenusPermissions({
            getIdentity: context.security.getIdentity,
            getPermissions: () => context.security.getPermissions("pb.menu"),
            fullAccessPermissionName: "pb.*"
        });

        const pagesPermissions = new PagesPermissions({
            getIdentity: context.security.getIdentity,
            getPermissions: () => context.security.getPermissions("pb.page"),
            fullAccessPermissionName: "pb.*"
        });

        const categoriesPermissions = new CategoriesPermissions({
            getIdentity: context.security.getIdentity,
            getPermissions: () => context.security.getPermissions("pb.category"),
            fullAccessPermissionName: "pb.*"
        });

        const blockCategoriesPermissions = new BlockCategoriesPermissions({
            getIdentity: context.security.getIdentity,
            getPermissions: () => context.security.getPermissions("pb.blockCategory"),
            fullAccessPermissionName: "pb.*"
        });

        const pageBlocksPermissions = new PageBlocksPermissions({
            getIdentity: context.security.getIdentity,
            getPermissions: () => context.security.getPermissions("pb.block"),
            fullAccessPermissionName: "pb.*"
        });

        const pageTemplatesPermissions = new PageTemplatesPermissions({
            getIdentity: context.security.getIdentity,
            getPermissions: () => context.security.getPermissions("pb.template"),
            fullAccessPermissionName: "pb.*"
        });

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
            menusPermissions,
            getTenantId,
            getLocaleCode
        });

        const categories = createCategoriesCrud({
            context,
            storageOperations,
            categoriesPermissions,
            pagesPermissions,
            getTenantId,
            getLocaleCode
        });

        const blockCategories = createBlockCategoriesCrud({
            context,
            storageOperations,
            blockCategoriesPermissions,
            getTenantId,
            getLocaleCode
        });

        const pageBlocks = createPageBlocksCrud({
            context,
            storageOperations,
            pageBlocksPermissions,
            getTenantId,
            getLocaleCode
        });

        const pageElements = createPageElementsCrud({
            context,
            storageOperations,
            pagesPermissions,
            getTenantId,
            getLocaleCode
        });

        const pages = createPageCrud({
            context,
            storageOperations,
            pagesPermissions,
            getTenantId,
            getLocaleCode
        });

        const pageTemplates = createPageTemplatesCrud({
            context,
            storageOperations,
            pageTemplatesPermissions,
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
            ...categories,
            ...blockCategories,
            ...pageBlocks,
            ...pageTemplates
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

    plugin.name = "page-builder.createContext";

    return plugin;
};

export const createCrud = (params: CreateCrudParams) => {
    return [
        new JsonpackContentCompressionPlugin(),
        new GzipContentCompressionPlugin(),
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
