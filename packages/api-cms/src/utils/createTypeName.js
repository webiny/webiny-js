import { upperFirst } from "lodash";

export const createTypeName = modelId => {
    return upperFirst(modelId);
};

export const createReadTypeName = baseTypeName => {
    return "CmsRead" + createTypeName(baseTypeName);
};

export const createManageTypeName = baseTypeName => {
    return "CmsManage" + createTypeName(baseTypeName);
};
