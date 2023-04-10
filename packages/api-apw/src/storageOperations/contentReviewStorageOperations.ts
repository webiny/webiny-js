import { ApwContentReviewStorageOperations } from "./types";
import {
    baseFields,
    CreateApwStorageOperationsParams,
    getFieldValues
} from "~/storageOperations/index";
import WebinyError from "@webiny/error";
import { CONTENT_REVIEW_MODEL_ID } from "~/storageOperations/models/contentReview.model";

export const createContentReviewStorageOperations = ({
    cms,
    security
}: CreateApwStorageOperationsParams): ApwContentReviewStorageOperations => {
    const getContentReviewModel = async () => {
        const model = await security.withoutAuthorization(async () => {
            return cms.getModel(CONTENT_REVIEW_MODEL_ID);
        });
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
        const entry = await security.withoutAuthorization(async () => {
            return cms.getEntryById(model, id);
        });
        return getFieldValues(entry, baseFields);
    };
    return {
        getContentReviewModel,
        getContentReview,
        async listContentReviews(params) {
            const model = await getContentReviewModel();

            const [entries, meta] = await security.withoutAuthorization(async () => {
                return cms.listLatestEntries(model, {
                    ...params,
                    where: {
                        ...params.where
                    }
                });
            });

            return [entries.map(entry => getFieldValues(entry, baseFields)), meta];
        },
        async createContentReview(params) {
            const model = await getContentReviewModel();

            const entry = await security.withoutAuthorization(async () => {
                return cms.createEntry(model, params.data);
            });
            return getFieldValues(entry, baseFields);
        },
        async updateContentReview(params) {
            const model = await getContentReviewModel();
            /**
             * We're fetching the existing entry here because we're not accepting "app" field as input,
             * but, we still need to retain its value after the "update" operation.
             */
            const existingEntry = await getContentReview({ id: params.id });

            const entry = await security.withoutAuthorization(async () => {
                return cms.updateEntry(model, params.id, {
                    ...existingEntry,
                    ...params.data
                });
            });
            return getFieldValues(entry, baseFields);
        },
        async deleteContentReview(params) {
            const model = await getContentReviewModel();

            await security.withoutAuthorization(async () => {
                return cms.deleteEntry(model, params.id);
            });

            return true;
        }
    };
};
