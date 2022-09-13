import { PluginsContainer } from "@webiny/plugins";
import {
    CmsModelConverterCallable,
    ConverterCollection,
    ConverterCollectionConvertParams as BaseConverterCollectionConvertParams
} from "~/utils/converters/ConverterCollection";
import { CmsModel, StorageOperationsCmsModel } from "~/types";
import semver from "semver";

const featureVersion = "5.33.0";

const isFeatureEnabled = (model: CmsModel): boolean => {
    /**
     * Possibility that the version is not defined, this means it is a quite old system where models did not change.
     */
    if (!model.webinyVersion) {
        return false;
    }
    /**
     * In case feature version value is greater than the model version, feature is not enabled as it is an older model with no storageId.
     *
     * TODO change if necessary after the update to the system
     */
    if (semver.compare(model.webinyVersion, featureVersion) === -1) {
        return false;
    }
    return true;
};

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

    if (isFeatureEnabled(model) === false) {
        return ({ values }: ConverterCollectionConvertParams) => {
            return values;
        };
    }

    const converters = new ConverterCollection({
        plugins
    });

    return ({ fields, values }: ConverterCollectionConvertParams) => {
        return converters.convertToStorage({
            fields: fields || model.fields,
            values
        });
    };
};

export const createValueKeyFromStorageConverter = (params: Params): CmsModelConverterCallable => {
    const { plugins, model } = params;

    if (isFeatureEnabled(model) === false) {
        return ({ values }: ConverterCollectionConvertParams) => {
            return values;
        };
    }

    const converters = new ConverterCollection({
        plugins
    });

    return ({ fields, values }: ConverterCollectionConvertParams) => {
        return converters.convertFromStorage({
            fields: fields || model.fields,
            values
        });
    };
};

interface AttachConvertersParams {
    plugins: PluginsContainer;
    model: CmsModel;
}
export const attachCmsModelFieldConverters = (
    params: AttachConvertersParams
): StorageOperationsCmsModel => {
    const { model, plugins } = params;
    return {
        ...model,
        convertValueKeyFromStorage: createValueKeyToStorageConverter({
            model,
            plugins
        }),
        convertValueKeyToStorage: createValueKeyFromStorageConverter({
            model,
            plugins
        })
    };
};
