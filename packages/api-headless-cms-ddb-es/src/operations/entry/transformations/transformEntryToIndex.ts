import { PluginsContainer } from "@webiny/plugins";
import {
    CmsEntry,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types";
import { prepareEntryToIndex } from "~/helpers";
import lodashCloneDeep from "lodash/cloneDeep";

interface TransformEntryToIndexParams {
    plugins: PluginsContainer;
    model: StorageOperationsCmsModel;
    entry: CmsEntry;
    storageEntry: CmsStorageEntry;
}

export const transformEntryToIndex = (params: TransformEntryToIndexParams) => {
    const { plugins, model, entry, storageEntry } = params;
    const result = prepareEntryToIndex({
        plugins,
        model,
        entry: lodashCloneDeep(entry),
        storageEntry: lodashCloneDeep(storageEntry)
    });

    delete result["PK"];
    delete result["SK"];
    delete result["GSI1_PK"];
    delete result["GSI1_SK"];
    delete result["published"];
    delete result["latest"];

    return result;
};
