import type { PluginsContainer } from "@webiny/plugins";
import type { CmsModelConverterCallable } from "./ConverterCollection.js";
import { ConverterCollection } from "./ConverterCollection.js";
import type { CmsEntryValues, CmsModel } from "~/types/index.js";
import type { ConverterCollectionConvertParams } from "./types.js";
import type { CmsModelFieldToGraphQLRegistry } from "~/features/graphql/index.js";

interface Params {
    model: Pick<CmsModel, "fields">;
    plugins: PluginsContainer;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
}

export const createValueKeyToStorageConverter = <T extends CmsEntryValues = CmsEntryValues>(
    params: Params
): CmsModelConverterCallable<T> => {
    const { plugins, model, fieldRegistry } = params;

    const converters = new ConverterCollection({
        plugins,
        fieldRegistry
    });

    return <T extends CmsEntryValues = CmsEntryValues>({
        fields,
        values
    }: ConverterCollectionConvertParams<T>) => {
        const result = converters.convertToStorage<T>({
            fields: fields || model.fields,
            values
        });
        return result || ({} as T);
    };
};
