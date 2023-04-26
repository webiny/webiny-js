import { CmsModel } from "@webiny/api-headless-cms/types";
import { FOLDER_MODEL_ID, SEARCH_RECORD_MODEL_ID } from "@webiny/api-aco";

const models = [SEARCH_RECORD_MODEL_ID, FOLDER_MODEL_ID];

export const isAcoModel = (model: Pick<CmsModel, "modelId">): boolean => {
    return models.includes(model.modelId);
};
