import { loadingRepositoryFactory } from "@webiny/app-utils";
import { createFeature } from "@webiny/feature/admin";
import { loadedFolderCacheFactory } from "~/features/folders/cache/index.js";
import { folderCacheFactory } from "~/features/folders/cache/index.js";
import { GetDescendantFoldersFeature } from "~/features/folders/getDescendantFolders/feature.js";
import { GetFolderAncestorsFeature } from "~/features/folders/getFolderAncestors/feature.js";
import { GetFolderExtensionsFieldsFeature } from "~/features/folders/getFolderExtensionsFields/feature.js";
import { GetFolderLevelPermissionFeature } from "~/features/folders/getFolderLevelPermission/feature.js";
import { ListFoldersFeature } from "~/features/folders/listFolders/feature.js";
import { ListFoldersByParentIdsFeature } from "~/features/folders/listFoldersByParentIds/feature.js";
import { LoadFolderHierarchyFeature } from "~/features/folders/loadFolderHierarchy/feature.js";
import { LoadedFoldersCache } from "./abstractions.js";
import { FoldersCache } from "./abstractions.js";
import { FoldersContext } from "./abstractions.js";
import { FoldersLoadingRepository } from "./abstractions.js";
import { DeleteFolderFeature } from "./deleteFolder/feature.js";
import { CreateFolderFeature } from "./createFolder/feature.js";
import { GetFolderFeature } from "./getFolder/feature.js";
import { UpdateFolderFeature } from "./updateFolder/feature.js";

export const FoldersFeature = createFeature({
    name: "Folders",
    register(container, context: FoldersContext.Interface) {
        // FoldersContext is used by other features to load the right folders type.
        container.registerInstance(FoldersContext, context);

        container.registerInstance(FoldersCache, folderCacheFactory.getCache(context.type));

        container.registerInstance(
            LoadedFoldersCache,
            loadedFolderCacheFactory.getCache(context.type)
        );

        const loadingRepository = loadingRepositoryFactory.getRepository(context.type);
        container.registerInstance(FoldersLoadingRepository, loadingRepository);

        // Folders features
        CreateFolderFeature.register(container);
        UpdateFolderFeature.register(container);
        DeleteFolderFeature.register(container);
        GetFolderFeature.register(container);
        GetDescendantFoldersFeature.register(container);
        GetFolderAncestorsFeature.register(container);
        GetFolderExtensionsFieldsFeature.register(container);
        GetFolderLevelPermissionFeature.register(container);
        LoadFolderHierarchyFeature.register(container);
        ListFoldersFeature.register(container);
        ListFoldersByParentIdsFeature.register(container);
    }
});
