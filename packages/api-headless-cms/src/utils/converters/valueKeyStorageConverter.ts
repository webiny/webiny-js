import type { PluginsContainer } from "@webiny/plugins";
import type {
    CmsModelConverterCallable,
    ConverterCollectionConvertParams as BaseConverterCollectionConvertParams
} from "~/utils/converters/ConverterCollection.js";
import { ConverterCollection } from "~/utils/converters/ConverterCollection.js";
import type { CmsModel, StorageOperationsCmsModel } from "~/types/index.js";

interface Params {
    /**
     * We need a model to determine if the conversion feature is enabled.
     */
    model: CmsModel;
    plugins: PluginsContainer;
}

/**
 * In the first call of the converter we do not need the fields property as it will be taken directly from the model.
 */
interface ConverterCollectionConvertParams
    extends Omit<BaseConverterCollectionConvertParams, "fields"> {
    fields?: BaseConverterCollectionConvertParams["fields"];
}

export const createValueKeyToStorageConverter = (params: Params): CmsModelConverterCallable => {
    const { plugins, model } = params;

    const converters = new ConverterCollection({
        plugins
    });

    return ({ fields, values }: ConverterCollectionConvertParams) => {
        const result = converters.convertToStorage({
            fields: fields || model.fields,
            values
        });
        return result || {};
    };
};

export const createValueKeyFromStorageConverter = (params: Params): CmsModelConverterCallable => {
    const { plugins, model } = params;

    const converters = new ConverterCollection({
        plugins
    });

    return ({ fields, values }: ConverterCollectionConvertParams) => {
        const result = converters.convertFromStorage({
            fields: fields || model.fields,
            values
        });
        return result || {};
    };
};

export const createCmsModelFieldConvertersAttachFactory = (plugins: PluginsContainer) => {
    return (model: StorageOperationsCmsModel | CmsModel): StorageOperationsCmsModel => {
        const storageModel = model as Partial<StorageOperationsCmsModel>;
        if (!!storageModel.convertValueKeyToStorage && !!storageModel.convertValueKeyFromStorage) {
            return storageModel as StorageOperationsCmsModel;
        }
        return {
            ...model,
            convertValueKeyToStorage: createValueKeyToStorageConverter({
                model,
                plugins
            }),
            convertValueKeyFromStorage: createValueKeyFromStorageConverter({
                model,
                plugins
            })
        };
    };
};
