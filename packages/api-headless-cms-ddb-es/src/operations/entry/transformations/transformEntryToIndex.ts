import type { PluginsContainer } from "@webiny/plugins";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { prepareEntryToIndex } from "~/helpers/index.js";
import type { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/features/graphql/index.js";

interface TransformEntryToIndexParams<T extends CmsEntryValues = CmsEntryValues> {
    plugins: PluginsContainer;
    model: StorageOperationsCmsModel<T>;
    entry: CmsEntry<T>;
    storageEntry: CmsStorageEntry<T>;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
}

export const transformEntryToIndex = <T extends CmsEntryValues = CmsEntryValues>(
    params: TransformEntryToIndexParams<T>
) => {
    const { plugins, model, entry, storageEntry, fieldRegistry } = params;
    const result = prepareEntryToIndex<T>({
        plugins,
        model,
        entry: structuredClone(entry),
        storageEntry: structuredClone(storageEntry),
        fieldRegistry
    });

    delete result["PK"];
    delete result["SK"];
    delete result["GSI1_PK"];
    delete result["GSI1_SK"];
    delete result["published"];
    delete result["latest"];

    return result;
};
