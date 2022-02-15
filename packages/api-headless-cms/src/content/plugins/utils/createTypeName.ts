import upperFirst from "lodash/upperFirst";

export const createTypeName = (modelId: string): string => {
    return upperFirst(modelId);
};

export const createReadTypeName = (baseTypeName: string): string => {
    return createTypeName(baseTypeName);
};

export const createManageTypeName = (baseTypeName: string): string => {
    return createTypeName(baseTypeName);
};
