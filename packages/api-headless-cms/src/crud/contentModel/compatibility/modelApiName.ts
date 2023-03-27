import pluralize from "pluralize";
import { CmsModel } from "~/types";
import { createTypeName } from "~/utils/createTypeName";

export const ensureSingularApiName = (model: CmsModel): string => {
    if (!model.singularApiName) {
        return createTypeName(model.modelId);
    }
    return model.singularApiName;
};

export const ensurePluralApiName = (model: CmsModel): string => {
    if (!model.pluralApiName) {
        return pluralize(ensureSingularApiName(model));
    }
    return model.pluralApiName;
};
