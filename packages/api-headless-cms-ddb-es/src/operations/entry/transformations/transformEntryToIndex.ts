import type { PluginsContainer } from "@webiny/plugins";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { prepareEntryToIndex } from "~/helpers/index.js";

interface TransformEntryToIndexParams<T extends CmsEntryValues = CmsEntryValues> {
    plugins: PluginsContainer;
    model: StorageOperationsCmsModel<T>;
    entry: CmsEntry<T>;
    storageEntry: CmsStorageEntry<T>;
}

export const transformEntryToIndex = <T extends CmsEntryValues = CmsEntryValues>(params: TransformEntryToIndexParams<T>) => {
    const { plugins, model, entry, storageEntry } = params;
    const result = prepareEntryToIndex<T>({
        plugins,
        model,
        entry: structuredClone(entry),
        storageEntry: structuredClone(storageEntry)
    });

    delete result["PK"];
    delete result["SK"];
    delete result["GSI1_PK"];
    delete result["GSI1_SK"];
    delete result["published"];
    delete result["latest"];

    return result;
};
