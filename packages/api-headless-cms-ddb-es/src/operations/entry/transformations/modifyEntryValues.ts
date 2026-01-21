import type {
    CmsEntry,
    CmsEntryValues,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import type { CmsEntryElasticsearchValuesModifier } from "~/plugins/index.js";

interface Params<T extends CmsEntryValues = CmsEntryValues> {
    model: StorageOperationsCmsModel<T>;
    plugins: CmsEntryElasticsearchValuesModifier[];
    entry: CmsEntry<T>;
}

export const modifyEntryValues = <T extends CmsEntryValues = CmsEntryValues>(params: Params<T>) => {
    const { plugins, model, entry } = params;
    let values = entry.values;
    for (const plugin of plugins) {
        values = plugin.modify<T>({
            model,
            entry,
            values
        });
    }
    return {
        ...entry,
        values
    };
};
