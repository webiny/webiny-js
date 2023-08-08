import { CmsEntry, StorageOperationsCmsModel } from "@webiny/api-headless-cms/types";
import { CmsEntryElasticsearchValuesModifier } from "~/plugins";

interface Params {
    model: StorageOperationsCmsModel;
    plugins: CmsEntryElasticsearchValuesModifier[];
    entry: CmsEntry;
}

export const modifyEntryValues = (params: Params) => {
    const { plugins, model, entry } = params;
    let values = entry.values;
    for (const plugin of plugins) {
        values = plugin.modify({
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
