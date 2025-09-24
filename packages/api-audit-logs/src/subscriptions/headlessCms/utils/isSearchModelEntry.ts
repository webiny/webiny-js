import { SEARCH_RECORD_MODEL_ID } from "@webiny/api-aco/record/record.model";

export const isSearchModelEntry = (modelId: string): boolean => {
    return modelId.startsWith(SEARCH_RECORD_MODEL_ID);
};
