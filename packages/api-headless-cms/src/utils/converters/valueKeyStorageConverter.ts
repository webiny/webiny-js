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
    plugins: PluginsContainer;
}

export const createValueKeyToStorageConverter = (params: Params) => {
    const { plugins } = params;

    const converters = new ConverterCollection({
        plugins
    });

    return ({ fields, values, model }: ConverterCollectionConvertParams) => {
        if (isFeatureEnabled(model) === false) {
            return values;
        }
        return converters.convertToStorage({
            fields,
            values,
            model
        });
    };
};

export const createValueKeyFromStorageConverter = (params: Params) => {
    const { plugins } = params;

    const converters = new ConverterCollection({
        plugins
    });

    return ({ fields, values, model }: ConverterCollectionConvertParams) => {
        if (isFeatureEnabled(model) === false) {
            return values;
        }

        return converters.convertFromStorage({
            fields,
            values,
            model
        });
    };
};
