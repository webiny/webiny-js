import { createFeature } from "@webiny/feature/admin";
import {
    FilesListCache,
    FileFieldsProvider as FileFieldsProviderAbstraction
} from "./abstractions.js";
import { ListCache } from "./FilesListCache.js";
import { FileFieldsProvider } from "./FileFieldsProvider.js";
import { FileFieldsProviderWithWcp } from "./FileFieldsProviderWithWcp.js";
import type { FmFile } from "./types.js";

export const SharedCacheFeature = createFeature({
    name: "FileManager/SharedCache",
    register(container) {
        container.registerInstance(FilesListCache, new ListCache<FmFile>());
        container.register(FileFieldsProvider).inSingletonScope();
        container.registerDecorator(FileFieldsProviderWithWcp);
    },
    resolve(container) {
        return {
            cache: container.resolve(FilesListCache),
            fileFieldsProvider: container.resolve(FileFieldsProviderAbstraction)
        };
    }
});
