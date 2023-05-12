import { PluginsContainer } from "@webiny/plugins";
import {
    CmsModelConverterCallable,
    ConverterCollection,
    ConverterCollectionConvertParams as BaseConverterCollectionConvertParams
} from "~/utils/converters/ConverterCollection";
import { CmsModel, StorageOperationsCmsModel } from "~/types";
import semver, { SemVer } from "semver";

const featureVersion = semver.coerce("5.33.0") as SemVer;

const isBetaOrNext = (model: CmsModel): boolean => {
    if (!model.webinyVersion) {
        return false;
    } else if (model.webinyVersion.startsWith("0.0.0")) {
        return true;
    }
    return model.webinyVersion.match(/next|beta|unstable/) !== null;
};

const isFeatureEnabled = (model: CmsModel): boolean => {
    /**
     * In case of disabled webinyVersion value, we disable this feature.
     * This is only for testing...
     */
    const disableConversion = !!process.env.WEBINY_API_TEST_STORAGE_ID_CONVERSION_DISABLE;
    if (model.webinyVersion === "disable" || disableConversion) {
        return false;
    }
    /**
     * If is a test environment, always have this turned on.
     */
    const nodeEnv = process.env.NODE_ENV as string;
    if (nodeEnv === "test" || nodeEnv === "disable" || isBetaOrNext(model)) {
        return true;
    }
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
    const modelVersion = semver.coerce(model.webinyVersion);
    if (!modelVersion) {
        console.log(`Warning: Model "${model.modelId}" does not have valid Webiny version set.`);
        return true;
    } else if (semver.compare(modelVersion, featureVersion) === -1) {
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
            return values || {};
        };
    }

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

    if (isFeatureEnabled(model) === false) {
        return ({ values }: ConverterCollectionConvertParams) => {
            return values || {};
        };
    }

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
