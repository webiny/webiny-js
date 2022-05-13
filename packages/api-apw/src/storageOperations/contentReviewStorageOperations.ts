import { ApwContentReviewStorageOperations } from "./types";
import {
    baseFields,
    CreateApwStorageOperationsParams,
    getFieldValues
} from "~/storageOperations/index";
import WebinyError from "@webiny/error";

export const createContentReviewStorageOperations = ({
    cms
}: Pick<CreateApwStorageOperationsParams, "cms">): ApwContentReviewStorageOperations => {
    const getContentReviewModel = async () => {
        const model = await cms.getModel("apwContentReviewModelDefinition");
        if (!model) {
            throw new WebinyError(
                "Could not find `apwContentReviewModelDefinition` model.",
                "MODEL_NOT_FOUND_ERROR"
            );
        }
        return model;
    };
    const getContentReview: ApwContentReviewStorageOperations["getContentReview"] = async ({
        id
    }) => {
        const model = await getContentReviewModel();
        const entry = await cms.getEntryById(model, id);
        return getFieldValues(entry, baseFields);
    };
    return {
        getContentReviewModel,
        getContentReview,
        async listContentReviews(params) {
            const model = await getContentReviewModel();
            const [entries, meta] = await cms.listLatestEntries(model, {
                ...params,
                where: {
                    ...params.where
                }
            });
            return [entries.map(entry => getFieldValues(entry, baseFields)), meta];
        },
        async createContentReview(params) {
            const model = await getContentReviewModel();
            const entry = await cms.createEntry(model, params.data);
            return getFieldValues(entry, baseFields);
        },
        async updateContentReview(params) {
            const model = await getContentReviewModel();
            /**
             * We're fetching the existing entry here because we're not accepting "app" field as input,
             * but, we still need to retain its value after the "update" operation.
             */
            const existingEntry = await getContentReview({ id: params.id });

            const entry = await cms.updateEntry(model, params.id, {
                ...existingEntry,
                ...params.data
            });
            return getFieldValues(entry, baseFields);
        },
        async deleteContentReview(params) {
            const model = await getContentReviewModel();
            await cms.deleteEntry(model, params.id);
            return true;
        }
    };
};
