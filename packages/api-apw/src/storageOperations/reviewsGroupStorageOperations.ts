import { ApwReviewersGroupStorageOperations } from "./types";
import {
    baseFields,
    CreateApwReviewersGroupStorageOperationsParams,
    getFieldValues
} from "~/storageOperations/index";
import WebinyError from "@webiny/error";

export const createReviewersGroupStorageOperations = ({
    cms,
    security
}: CreateApwReviewersGroupStorageOperationsParams): ApwReviewersGroupStorageOperations => {
    const getReviewersGroupModel = async () => {
        const model = await security.withoutAuthorization(async () => {
            return cms.getModel("apwReviewersGroupModelDefinition");
        });
        if (!model) {
            throw new WebinyError(
                "Could not find `apwReviewersGroupModelDefinition` model.",
                "MODEL_NOT_FOUND_ERROR"
            );
        }
        return model;
    };

    return {
        getReviewersGroupModel,
        async createReviewersGroup(params) {
            const model = await getReviewersGroupModel();
            const entry = await security.withoutAuthorization(async () => {
                return cms.createEntry(model, params.data);
            });
            return getFieldValues(entry, baseFields);
        }
    };
};
