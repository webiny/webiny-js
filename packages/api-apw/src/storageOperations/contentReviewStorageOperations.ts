import { ApwContentReviewStorageOperations } from "./types";
import { CreateApwStorageOperationsParams } from "~/storageOperations";
import { pickEntryFieldValues } from "~/utils/pickEntryFieldValues";
import WebinyError from "@webiny/error";
import { CONTENT_REVIEW_MODEL_ID } from "~/storageOperations/models/contentReview.model";
import { ApwContentReview } from "~/types";

export const createContentReviewStorageOperations = ({
    cms
}: CreateApwStorageOperationsParams): ApwContentReviewStorageOperations => {
    const getContentReviewModel = async () => {
        const model = await cms.getModel(CONTENT_REVIEW_MODEL_ID);
        if (!model) {
            throw new WebinyError(
                `Could not find "${CONTENT_REVIEW_MODEL_ID}" model.`,
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
        return pickEntryFieldValues(entry);
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

            return [entries.map(pickEntryFieldValues<ApwContentReview>), meta];
        },
        async createContentReview(params) {
            const model = await getContentReviewModel();

            const entry = await cms.createEntry(model, params.data);
            return pickEntryFieldValues(entry);
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
                ...params.data,
                savedOn: new Date()
            });
            return pickEntryFieldValues(entry);
        },
        async deleteContentReview(params) {
            const model = await getContentReviewModel();
            await cms.deleteEntry(model, params.id);

            return true;
        }
    };
};
