import camelCase from "lodash/camelCase";
import upperFirst from "lodash/upperFirst";
import pluralize from "pluralize";
import { CmsModel } from "~/types";

export const ensureSingularApiName = (model: CmsModel): string => {
    if (!model.singularApiName) {
        return upperFirst(camelCase(model.modelId));
    }
    return model.singularApiName;
};

export const ensurePluralApiName = (model: CmsModel): string => {
    if (!model.pluralApiName) {
        return pluralize(ensureSingularApiName(model));
    }
    return model.pluralApiName;
};
