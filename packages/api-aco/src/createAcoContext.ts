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
import { createFlpCrudMethods } from "~/flp/index.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
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
import { EnsureFolderIsEmptyOnDeleteFeature } from "~/features/folders/EnsureFolderIsEmptyOnDelete/index.js";
import {
    FilterStorageOperations,
    FolderStorageOperations
} from "~/features/folders/shared/abstractions.js";
import { ListFlpsFeature } from "~/features/flp/ListFlps/feature.js";
import { GetFlpFeature } from "~/features/flp/GetFlp/feature.js";

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

    FolderLevelPermissionsFeature.register(context.container);

    /**
     * Register legacy dependencies via abstractions
     */
    context.container.registerInstance(FolderStorageOperations, storageOperations.folder);
    context.container.registerInstance(FilterStorageOperations, storageOperations.filter);

    /**
     * Register folder features into DI container
     */
    CreateFolderFeature.register(context.container);

    UpdateFolderFeature.register(context.container);

    DeleteFolderFeature.register(context.container);

    GetFolderFeature.register(context.container);

    ListFoldersFeature.register(context.container);

    ListFolderLevelPermissionsTargetsFeature.register(context.container);

    GetFolderHierarchyFeature.register(context.container, {
        storageOperations: storageOperations.folder
    });

    GetAncestorsFeature.register(context.container);

    /**
     * Register FLP use cases and event handlers
     */
    CreateFlpFeature.register(context.container, { context });
    UpdateFlpFeature.register(context.container, { context });
    DeleteFlpFeature.register(context.container, { context });
    ListFlpsFeature.register(context.container, flpCrudMethods);
    GetFlpFeature.register(context.container, flpCrudMethods);

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
     * Register folder event handlers
     */
    EnsureFolderIsEmptyOnDeleteFeature.register(context.container, { context });

    EnsureFmFolderIsEmptyOnDeleteFeature.register(context.container, { context });

    EnsureHcmsFolderIsEmptyOnDeleteFeature.register(context.container, { context });

    /**
     * Setup legacy context
     */
    const folderLevelPermissions = context.container.resolve(FolderLevelPermissions);

    context.aco = {
        folder: createFolderCrudMethods({ container: context.container }),
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
