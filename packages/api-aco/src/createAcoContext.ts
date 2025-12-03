import { ContextPlugin } from "@webiny/api";
import { isHeadlessCmsReady } from "@webiny/api-headless-cms";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createAcoStorageOperations } from "~/createAcoStorageOperations.js";
import type { AcoContext } from "~/types.js";
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
import { FilterStorageOperations } from "~/features/folders/shared/abstractions.js";
import { ListFlpsFeature } from "~/features/flp/ListFlps/feature.js";
import { GetFlpFeature } from "~/features/flp/GetFlp/feature.js";
import { ListFolderLevelPermissionsTargetsFeature } from "~/features/folders/ListFolderLevelPermissionsTargets/feature.js";
import { Tenant } from "@webiny/api-core/types/tenancy";
import { getLocale } from "@webiny/api-core/legacy/i18n/getLocale.js";
import { CmsFlpFeature } from "~/features/cms/index.js";
import { createFolderModel, FOLDER_MODEL_ID } from "~/domain/folder/folder.model.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { FolderModel } from "~/domain/folder/abstractions.js";
import { createModelPlugin } from "@webiny/api-headless-cms/plugins/index.js";

interface CreateAcoContextParams {
    useFolderLevelPermissions?: boolean;
    documentClient: DynamoDBDocument;
}

const setupAcoContext = async (
    context: AcoContext,
    setupAcoContextParams: CreateAcoContextParams
): Promise<void> => {
    const { tenancy, security } = context;

    const folderModelDefinition = createFolderModel();
    context.plugins.register(createModelPlugin(folderModelDefinition));

    const getModel = context.container.resolve(GetModelUseCase);

    await context.security.withoutAuthorization(async () => {
        const folderModel = await getModel.execute(FOLDER_MODEL_ID);
        context.container.registerInstance(FolderModel, folderModel.value);
    });

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

    GetFolderHierarchyFeature.register(context.container);

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
        CmsFlpFeature.register(context.container);
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
