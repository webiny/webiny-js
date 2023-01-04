import upperFirst from "lodash/upperFirst";
import camelCase from "lodash/camelCase";

export const createTypeName = (modelId: string): string => {
    return upperFirst(camelCase(modelId));
};

export const createReadTypeName = (baseTypeName: string): string => {
    return createTypeName(baseTypeName);
};

export const createManageTypeName = (baseTypeName: string): string => {
    return createTypeName(baseTypeName);
};
