import { upperFirst } from "lodash";

export const createTypeName = modelId => {
    return upperFirst(modelId);
};

export const createReadTypeName = baseTypeName => {
    return "HeadlessRead" + createTypeName(baseTypeName);
};

export const createManageTypeName = baseTypeName => {
    return "HeadlessManage" + createTypeName(baseTypeName);
};
