import upperFirst from "lodash/upperFirst";
import camelCase from "lodash/camelCase";

export const createTypeName = (modelId: string): string => {
    return upperFirst(camelCase(modelId));
};
