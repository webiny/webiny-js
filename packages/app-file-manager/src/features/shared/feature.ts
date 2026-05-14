import { createFeature } from "@webiny/feature/admin";
import { FilesListCache } from "./abstractions.js";
import { ListCache } from "./FilesListCache.js";
import type { FmFile } from "./types.js";

export const SharedCacheFeature = createFeature({
    name: "FileManager/SharedCache",
    register(container) {
        container.registerInstance(FilesListCache, new ListCache<FmFile>());
    },
    resolve(container) {
        return {
            cache: container.resolve(FilesListCache)
        };
    }
});
