import type {
    CmsEntry,
    CmsEntryValues,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import type { CmsEntryOpenSearchValuesModifier } from "~/features/CmsEntryOpenSearchValuesModifier/index.js";

interface Params<T extends CmsEntryValues = CmsEntryValues> {
    model: StorageOperationsCmsModel<T>;
    modifiers: CmsEntryOpenSearchValuesModifier.Interface[];
    entry: CmsEntry<T>;
}

export const modifyEntryValues = <T extends CmsEntryValues = CmsEntryValues>(params: Params<T>) => {
    const { modifiers, model, entry } = params;
    let values = entry.values;
    for (const modifier of modifiers) {
        values = modifier.modify<T>({
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
