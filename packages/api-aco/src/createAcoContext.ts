import { ContextPlugin } from "@webiny/api";
import { isHeadlessCmsReady } from "@webiny/api-headless-cms";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/abstractions.js";
import { createFilterOperations } from "~/filter/filter.so.js";
import { createFilterCrudMethods } from "~/filter/filter.crud.js";
import type { AcoContext } from "~/types.js";
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
import {
    AcoFilterCrud,
    AcoFlpCrud,
    FilterStorageOperations,
    FlpStorageOperations
} from "~/features/folder/shared/abstractions.js";
import { ListFlpsFeature } from "~/features/flp/ListFlps/feature.js";
import { GetFlpFeature } from "~/features/flp/GetFlp/feature.js";
import { ListFolderLevelPermissionsTargetsFeature } from "~/features/folder/ListFolderLevelPermissionsTargets/feature.js";
import { Tenant } from "@webiny/api-core/types/tenancy";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { CmsFlpFeature } from "~/features/cms/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { FolderModel as FolderModelAbstraction } from "~/domain/folder/abstractions.js";
import { CreateFlpOnFolderCreatedFeature } from "~/features/flp/CreateFlpOnFolderCreated/index.js";
import { EnsureFolderIsEmptyFeature } from "~/features/folder/EnsureFolderIsEmpty/feature.js";
import { FOLDER_MODEL_ID, FolderModel } from "~/domain/folder/folder.model.js";
import { FilterPrivateModel } from "~/filter/filter.model.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import type { AcoStorageOperations } from "~/types.js";

const setupAcoContext = async (context: AcoContext): Promise<void> => {
    const { cms, container } = context;

    const identityContext = container.resolve(IdentityContext);
    const tenantContext = container.resolve(TenantContext);

    const getModel = container.resolve(GetModelUseCase);

    await identityContext.withoutAuthorization(async () => {
        const folderModel = await getModel.execute(FOLDER_MODEL_ID);
        container.registerInstance(FolderModelAbstraction, folderModel.value);
    });

    const getTenant = (): Tenant => {
        return tenantContext.getTenant();
    };

    const flpSo = container.resolve(FlpStorageOperations);
    const filterSo = createFilterOperations({ cms, identityContext, container });

    const storageOperations: AcoStorageOperations = {
        filter: filterSo,
        flp: flpSo
    };

    const flpCrudMethods = createFlpCrudMethods({
        getTenant,
        storageOperations
    });

    FolderLevelPermissionsFeature.register(container);

    container.registerInstance(FilterStorageOperations, storageOperations.filter);
    container.registerInstance(AcoFlpCrud, flpCrudMethods);

    CreateFolderFeature.register(container);
    UpdateFolderFeature.register(container);
    DeleteFolderFeature.register(container);
    GetFolderFeature.register(container);
    ListFoldersFeature.register(container);
    ListFolderLevelPermissionsTargetsFeature.register(container);
    GetFolderHierarchyFeature.register(container);
    GetAncestorsFeature.register(container);
    EnsureFolderIsEmptyFeature.register(container);

    CreateFlpFeature.register(container);
    UpdateFlpFeature.register(container);
    DeleteFlpFeature.register(container);
    ListFlpsFeature.register(container, flpCrudMethods);
    GetFlpFeature.register(container, flpCrudMethods);

    CreateFlpOnFolderCreatedFeature.register(container);
    UpdateFlpOnFolderUpdatedFeature.register(container);
    DeleteFlpOnFolderDeletedFeature.register(container);

    EnsureFolderIsEmptyOnDeleteFeature.register(container);
    EnsureHcmsFolderIsEmptyOnDeleteFeature.register(container);

    const folderLevelPermissions = container.resolve(FolderLevelPermissions);

    const filterCrudMethods = createFilterCrudMethods({
        container,
        getTenant,
        storageOperations,
        folderLevelPermissions
    });
    container.registerInstance(AcoFilterCrud, filterCrudMethods);

    context.aco = {
        filter: filterCrudMethods,
        flp: flpCrudMethods
    };

    if (container.resolve(WcpContext).canUseFolderLevelPermissions()) {
        CmsFlpFeature.register(container);
    }
};

export const createAcoContext = () => {
    const modelsPlugin = createRegisterExtensionPlugin(context => {
        context.container.register(FolderModel);
        context.container.register(FilterPrivateModel);
    });

    const acoContextPlugin = new ContextPlugin<AcoContext>(async context => {
        if (!(await isHeadlessCmsReady(context))) {
            return;
        }

        await context.benchmark.measure("aco.context.setup", async () => {
            await setupAcoContext(context);
        });
    });

    acoContextPlugin.name = "aco.createContext";

    return [acoContextPlugin, modelsPlugin];
};
