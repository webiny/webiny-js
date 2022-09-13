import { PluginsContainer } from "@webiny/plugins";
import {
    ConverterCollection,
    ConverterCollectionConvertParams
} from "~/utils/converters/ConverterCollection";
import { CmsModel } from "~/types";
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
    model: CmsModel;
    plugins: PluginsContainer;
}

export const createValueKeyToStorageConverter = (params: Params) => {
    const { plugins, model } = params;
    if (isFeatureEnabled(model) === false) {
        return (params: ConverterCollectionConvertParams) => {
            return params.values;
        };
    }

    const converters = new ConverterCollection({
        plugins
    });

    return (params: ConverterCollectionConvertParams) => {
        return converters.convertToStorage(params);
    };
};

export const createValueKeyFromStorageConverter = (params: Params) => {
    const { plugins, model } = params;

    if (isFeatureEnabled(model) === false) {
        return (params: ConverterCollectionConvertParams) => {
            return params.values;
        };
    }

    const converters = new ConverterCollection({
        plugins
    });

    return (params: ConverterCollectionConvertParams) => {
        return converters.convertFromStorage(params);
    };
};
