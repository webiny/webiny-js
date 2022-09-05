import { ApwReviewerStorageOperations } from "./types";
import {
    baseFields,
    CreateApwStorageOperationsParams,
    getFieldValues
} from "~/storageOperations/index";
import WebinyError from "@webiny/error";

export const createReviewerStorageOperations = ({
    cms,
    security
}: CreateApwStorageOperationsParams): ApwReviewerStorageOperations => {
    const getReviewerModel = async () => {
        const model = await cms.getModel("apwReviewerModelDefinition");
        if (!model) {
            throw new WebinyError(
                "Could not find `apwReviewerModelDefinition` model.",
                "MODEL_NOT_FOUND_ERROR"
            );
        }
        return model;
    };
    const getReviewer: ApwReviewerStorageOperations["getReviewer"] = async ({ id }) => {
        const model = await getReviewerModel();
        security.disableAuthorization();
        const entry = await cms.getEntryById(model, id);
        security.enableAuthorization();
        return getFieldValues(entry, baseFields);
    };
    return {
        getReviewerModel,
        getReviewer,
        async listReviewers(params) {
            const model = await getReviewerModel();
            security.disableAuthorization();
            const [entries, meta] = await cms.listLatestEntries(model, {
                ...params,
                where: {
                    ...params.where
                }
            });
            security.enableAuthorization();
            return [entries.map(entry => getFieldValues(entry, baseFields)), meta];
        },
        async createReviewer(params) {
            const model = await getReviewerModel();
            security.disableAuthorization();
            const entry = await cms.createEntry(model, params.data);
            security.enableAuthorization();
            return getFieldValues(entry, baseFields);
        },
        async updateReviewer(params) {
            const model = await getReviewerModel();
            /**
             * We're fetching the existing entry here because we're not accepting "app" field as input,
             * but, we still need to retain its value after the "update" operation.
             */
            const existingEntry = await getReviewer({ id: params.id });

            security.disableAuthorization();
            const entry = await cms.updateEntry(model, params.id, {
                ...existingEntry,
                ...params.data
            });
            security.enableAuthorization();
            return getFieldValues(entry, baseFields);
        },
        async deleteReviewer(params) {
            const model = await getReviewerModel();
            security.disableAuthorization();
            await cms.deleteEntry(model, params.id);
            security.enableAuthorization();
            return true;
        }
    };
};
