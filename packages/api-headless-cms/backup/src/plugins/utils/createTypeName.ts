import upperFirst from "lodash/upperFirst";

export const createTypeName = (modelId: string) => {
    return upperFirst(modelId);
};

export const createReadTypeName = (baseTypeName: string) => {
    return "CmsRead" + createTypeName(baseTypeName);
};

export const createManageTypeName = (baseTypeName: string) => {
    return "CmsManage" + createTypeName(baseTypeName);
};
