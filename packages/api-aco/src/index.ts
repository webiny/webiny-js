import { createAcoContext } from "~/createAcoContext";
import { createAcoGraphQL } from "~/createAcoGraphQL";

export { SEARCH_RECORD_MODEL_ID } from "./record/record.model";
export { FOLDER_MODEL_ID } from "./folder/folder.model";
export { FILTER_MODEL_ID } from "./filter/filter.model";
export * from "./apps";
export * from "./plugins";

export interface CreateAcoParams {
    useFolderLevelPermissions?: boolean;
}

export const createAco = (params: CreateAcoParams = {}) => {
    return [createAcoContext(params), ...createAcoGraphQL()];
};
