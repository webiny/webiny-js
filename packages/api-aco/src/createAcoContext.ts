import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/api";
import type { I18NLocale } from "@webiny/api-i18n/types.js";
import type { Tenant } from "@webiny/api-tenancy/types.js";
import { isHeadlessCmsReady } from "@webiny/api-headless-cms";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createAcoStorageOperations } from "~/createAcoStorageOperations.js";
import type { AcoContext } from "~/types.js";
import { createFolderCrudMethods } from "~/folder/folder.crud.js";
import { CmsEntriesCrudDecorators } from "~/utils/decorators/CmsEntriesCrudDecorators.js";
import { createFilterCrudMethods } from "~/filter/filter.crud.js";
import { createFlpCrudMethods, FolderLevelPermissions } from "~/flp/index.js";
import { UpdateFolderFeature } from "~/features/folders/UpdateFolder/index.js";
import { DeleteFolderFeature } from "~/features/folders/DeleteFolder/index.js";
import { CreateFolderFeature } from "~/features/folders/CreateFolder/index.js";
import { GetFolderFeature } from "~/features/folders/GetFolder/index.js";
import { ListFoldersFeature } from "~/features/folders/ListFolders/index.js";
import { GetFolderHierarchyFeature } from "~/features/folders/GetFolderHierarchy/index.js";
import { GetAncestorsFeature } from "~/features/folders/GetAncestors/index.js";
import { ListFolderLevelPermissionsTargetsFeature } from "~/features/folders/ListFolderLevelPermissionsTargets/index.js";
import { CreateFlpOnFolderCreatedFeature } from "~/features/flp/CreateFlpOnFolderCreated/index.js";
import { UpdateFlpOnFolderUpdatedFeature } from "~/features/flp/UpdateFlpOnFolderUpdated/index.js";
import { DeleteFlpOnFolderDeletedFeature } from "~/features/flp/DeleteFlpOnFolderDeleted/index.js";
import { EnsureFmFolderIsEmptyOnDeleteFeature } from "~/features/folders/EnsureFmFolderIsEmptyOnDelete/index.js";
import { EnsureHcmsFolderIsEmptyOnDeleteFeature } from "~/features/folders/EnsureHcmsFolderIsEmptyOnDelete/index.js";
import { CreateFlpFeature } from "~/features/flp/CreateFlp/index.js";
import { DeleteFlpFeature } from "~/features/flp/DeleteFlp/index.js";
import { UpdateFlpFeature } from "~/features/flp/UpdateFlp/index.js";
import { FolderLevelPermissionsFeature } from "~/features/flp/FolderLevelPermissions/index.js";

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

    FolderLevelPermissionsFeature.register(context.container, { context, crud: flpCrudMethods });

    /**
     * Register folder features into DI container
     */
    CreateFolderFeature.register(context.container, {
        storageOperations: storageOperations.folder,
        folderLevelPermissions
    });

    UpdateFolderFeature.register(context.container, {
        storageOperations: storageOperations.folder,
        folderLevelPermissions
    });

    DeleteFolderFeature.register(context.container, {
        storageOperations: storageOperations.folder,
        folderLevelPermissions
    });

    GetFolderFeature.register(context.container, {
        storageOperations: storageOperations.folder,
        folderLevelPermissions
    });

    ListFoldersFeature.register(context.container, {
        storageOperations: storageOperations.folder,
        folderLevelPermissions
    });

    ListFolderLevelPermissionsTargetsFeature.register(context.container, {
        security: context.security,
        adminUsers: context.adminUsers
    });

    GetFolderHierarchyFeature.register(context.container, {
        storageOperations: storageOperations.folder,
        folderLevelPermissions
    });

    GetAncestorsFeature.register(context.container);

    /**
     * Register FLP use cases and event handlers
     */
    CreateFlpFeature.register(context.container, { context });
    UpdateFlpFeature.register(context.container, { context });
    DeleteFlpFeature.register(context.container, { context });

    CreateFlpOnFolderCreatedFeature.register(context.container, {
        tasks: context.tasks
    });

    UpdateFlpOnFolderUpdatedFeature.register(context.container, {
        tasks: context.tasks
    });

    DeleteFlpOnFolderDeletedFeature.register(context.container, {
        tasks: context.tasks
    });

    /**
     * Register folder event handlers into DI container
     */
    EnsureFmFolderIsEmptyOnDeleteFeature.register(context.container, { context });

    EnsureHcmsFolderIsEmptyOnDeleteFeature.register(context.container, { context });

    /**
     * Setup legacy context
     */
    context.aco = {
        folder: createFolderCrudMethods({ container: context.container }),
        folderLevelPermissions,
        filter: createFilterCrudMethods({
            container: context.container,
            getLocale,
            getTenant,
            storageOperations,
            folderLevelPermissions
        }),
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
    });

    plugin.name = "aco.createContext";

    return plugin;
};
