import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/api";
import type { I18NLocale } from "@webiny/api-i18n/types.js";
import type { Tenant } from "@webiny/api-tenancy/types.js";
import { isHeadlessCmsReady } from "@webiny/api-headless-cms";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createAcoHooks } from "~/createAcoHooks.js";
import { createAcoStorageOperations } from "~/createAcoStorageOperations.js";
import type { AcoContext, CreateAcoParams } from "~/types.js";
import { createFolderCrudMethods } from "~/folder/folder.crud.js";
import { CmsEntriesCrudDecorators } from "~/utils/decorators/CmsEntriesCrudDecorators.js";
import { createFilterCrudMethods } from "~/filter/filter.crud.js";
import { createFlpCrudMethods, FolderLevelPermissions } from "~/flp/index.js";
import { UpdateFolderFeature } from "~/features/folders/UpdateFolder/index.js";

interface CreateAcoContextParams {
    useFolderLevelPermissions?: boolean;
    documentClient: DynamoDBDocument;
}

const setupAcoContext = async (
    context: AcoContext,
    setupAcoContextParams: CreateAcoContextParams
): Promise<void> => {
    const { tenancy, security, i18n } = context;

    const getLocale = (): I18NLocale => {
        const locale = i18n.getContentLocale();
        if (!locale) {
            throw new WebinyError(
                "Missing content locale in api-aco/plugins/context.ts",
                "LOCALE_ERROR"
            );
        }

        return locale;
    };

    const getTenant = (): Tenant => {
        return tenancy.getCurrentTenant();
    };

    const storageOperations = await createAcoStorageOperations({
        /**
         * TODO: We need to figure out a way to pass "cms" from outside (e.g. apps/api/graphql)
         */
        cms: context.cms,
        /**
         * TODO: This is required for "entryFieldFromStorageTransform" which access plugins from context.
         */
        getCmsContext: () => context,
        documentClient: setupAcoContextParams.documentClient,
        security
    });

    const flpCrudMethods = createFlpCrudMethods({
        getLocale,
        getTenant,
        storageOperations
    });

    const folderLevelPermissions = new FolderLevelPermissions({ context, crud: flpCrudMethods });

    /**
     * Register features into DI container
     */
    UpdateFolderFeature.register(context.container, {
        storageOperations: storageOperations.folder,
        folderLevelPermissions
    });

    /**
     * Setup legacy context
     */

    const params: CreateAcoParams = {
        container: context.container,
        getLocale,
        getTenant,
        storageOperations,
        folderLevelPermissions
    };

    context.aco = {
        folder: createFolderCrudMethods({
            ...params,
            context
        }),
        folderLevelPermissions,
        filter: createFilterCrudMethods(params),
        flp: flpCrudMethods
    };

    if (context.wcp.canUseFolderLevelPermissions()) {
        new CmsEntriesCrudDecorators({ context }).decorate();
    }
};

export const createAcoContext = (params: CreateAcoContextParams) => {
    const plugin = new ContextPlugin<AcoContext>(async context => {
        /**
         * We can skip the ACO initialization if the installation is pending.
         */
        if (!(await isHeadlessCmsReady(context))) {
            return;
        }

        await context.benchmark.measure("aco.context.setup", async () => {
            await setupAcoContext(context, params);
        });

        await context.benchmark.measure("aco.context.hooks", async () => {
            await createAcoHooks(context);
        });
    });

    plugin.name = "aco.createContext";

    return plugin;
};
