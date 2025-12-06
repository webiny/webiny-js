import { createFeature } from "@webiny/feature/admin";
import { CreateFolderFeature } from "~/features/folders/createFolder/feature.js";
import { loadedFolderCacheFactory } from "~/features/index.js";
import { folderCacheFactory } from "~/features/index.js";
import { LoadedFoldersCache } from "./abstractions.js";
import { FoldersCache } from "./abstractions.js";
import { FoldersContext } from "./abstractions.js";

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

        // Folders features
        CreateFolderFeature.register(container);
    }
});
