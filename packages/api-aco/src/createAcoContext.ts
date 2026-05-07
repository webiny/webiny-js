import { ContextPlugin } from "@webiny/api";
import { isHeadlessCmsReady } from "@webiny/api-headless-cms";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createAcoStorageOperations } from "~/createAcoStorageOperations.js";
import type { AcoContext } from "~/types.js";
import { createFilterCrudMethods } from "~/filter/filter.crud.js";
import { createFlpCrudMethods } from "~/flp/index.js";
import {
    FolderLevelPermissions,
    FolderLevelPermissionsFeature
} from "~/features/flp/FolderLevelPermissions/index.js";
import { UpdateFolderFeature } from "~/features/folder/UpdateFolder/index.js";
import { DeleteFolderFeature } from "~/features/folder/DeleteFolder/index.js";
import { CreateFolderFeature } from "~/features/folder/CreateFolder/index.js";
import { GetFolderFeature } from "~/features/folder/GetFolder/index.js";
import { ListFoldersFeature } from "~/features/folder/ListFolders/index.js";
import { GetFolderHierarchyFeature } from "~/features/folder/GetFolderHierarchy/index.js";
import { GetAncestorsFeature } from "~/features/folder/GetAncestors/index.js";
import { UpdateFlpOnFolderUpdatedFeature } from "~/features/flp/UpdateFlpOnFolderUpdated/index.js";
import { DeleteFlpOnFolderDeletedFeature } from "~/features/flp/DeleteFlpOnFolderDeleted/index.js";
import { EnsureHcmsFolderIsEmptyOnDeleteFeature } from "~/features/folder/EnsureHcmsFolderIsEmptyOnDelete/index.js";
import { CreateFlpFeature } from "~/features/flp/CreateFlp/index.js";
import { DeleteFlpFeature } from "~/features/flp/DeleteFlp/index.js";
import { UpdateFlpFeature } from "~/features/flp/UpdateFlp/index.js";
import { EnsureFolderIsEmptyOnDeleteFeature } from "~/features/folder/EnsureFolderIsEmptyOnDelete/index.js";
import { FilterStorageOperations } from "~/features/folder/shared/abstractions.js";
import { ListFlpsFeature } from "~/features/flp/ListFlps/feature.js";
import { GetFlpFeature } from "~/features/flp/GetFlp/feature.js";
import { ListFolderLevelPermissionsTargetsFeature } from "~/features/folder/ListFolderLevelPermissionsTargets/feature.js";
import { Tenant } from "@webiny/api-core/types/tenancy";
import { CmsFlpFeature } from "~/features/cms/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { FolderModel as FolderModelAbstraction } from "~/domain/folder/abstractions.js";
import { CreateFlpOnFolderCreatedFeature } from "~/features/flp/CreateFlpOnFolderCreated/index.js";
import { EnsureFolderIsEmptyFeature } from "~/features/folder/EnsureFolderIsEmpty/feature.js";
import { FOLDER_MODEL_ID, FolderModel } from "~/domain/folder/folder.model.js";
import { FilterPrivateModel } from "~/filter/filter.model.js";

/**
 * Factory that builds ACO storage operations given the request-scoped CMS
 * context. Container deployments supply a SQLite-backed factory; the
 * serverless path uses the DDB-backed default that's built internally from
 * `documentClient`.
 */
export type AcoStorageOperationsFactory = (
    context: AcoContext
) => Promise<import("~/types.js").AcoStorageOperations>;

export interface CreateAcoContextParams {
    /**
     * @deprecated Pass `storageOperationsFactory` instead. Kept for
     * backwards compatibility — when set, an internal DDB-backed factory is
     * built from it. Will be removed in a future major.
     */
    documentClient?: DynamoDBDocument;
    /**
     * Factory that builds the ACO storage operations from the request-scoped
     * CMS context. New preferred input. If both this and `documentClient`
     * are provided, this wins and `documentClient` is ignored.
     */
    storageOperationsFactory?: AcoStorageOperationsFactory;
    useFolderLevelPermissions?: boolean;
}

const setupAcoContext = async (
    context: AcoContext,
    setupAcoContextParams: CreateAcoContextParams
): Promise<void> => {
    const { tenancy, security } = context;

    context.container.register(FolderModel);
    context.container.register(FilterPrivateModel);

    const getModel = context.container.resolve(GetModelUseCase);

    await context.security.withoutAuthorization(async () => {
        const folderModel = await getModel.execute(FOLDER_MODEL_ID);
        context.container.registerInstance(FolderModelAbstraction, folderModel.value);
    });

    const getTenant = (): Tenant => {
        return tenancy.getCurrentTenant();
    };

    const storageOperations = setupAcoContextParams.storageOperationsFactory
        ? await setupAcoContextParams.storageOperationsFactory(context)
        : await (async () => {
              if (!setupAcoContextParams.documentClient) {
                  throw new Error(
                      "createAcoContext: either `storageOperationsFactory` or `documentClient` must be provided."
                  );
              }
              return createAcoStorageOperations({
                  cms: context.cms,
                  container: context.container,
                  documentClient: setupAcoContextParams.documentClient,
                  security
              });
          })();

    const flpCrudMethods = createFlpCrudMethods({
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

    EnsureFolderIsEmptyFeature.register(context.container);

    /**
     * Register FLP use cases and event handlers
     */
    CreateFlpFeature.register(context.container, { context });
    UpdateFlpFeature.register(context.container, { context });
    DeleteFlpFeature.register(context.container, { context });
    ListFlpsFeature.register(context.container, flpCrudMethods);
    GetFlpFeature.register(context.container, flpCrudMethods);

    CreateFlpOnFolderCreatedFeature.register(context.container);

    UpdateFlpOnFolderUpdatedFeature.register(context.container);

    DeleteFlpOnFolderDeletedFeature.register(context.container);

    /**
     * Register folder event handlers
     */
    EnsureFolderIsEmptyOnDeleteFeature.register(context.container);
    EnsureHcmsFolderIsEmptyOnDeleteFeature.register(context.container);

    /**
     * Setup legacy context
     */
    const folderLevelPermissions = context.container.resolve(FolderLevelPermissions);

    context.aco = {
        filter: createFilterCrudMethods({
            container: context.container,
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
