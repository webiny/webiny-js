import { ApwReviewerStorageOperations } from "./types";
import { CreateApwStorageOperationsParams } from "~/storageOperations";
import { pickEntryFieldValues } from "~/utils/pickEntryFieldValues";
import WebinyError from "@webiny/error";
import { ApwReviewer } from "~/types";

export const createReviewerStorageOperations = ({
    cms,
    security
}: CreateApwStorageOperationsParams): ApwReviewerStorageOperations => {
    const getReviewerModel = async () => {
        const model = await security.withoutAuthorization(async () => {
            return cms.getModel("apwReviewerModelDefinition");
        });
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

        const entry = await security.withoutAuthorization(async () => {
            return cms.getEntryById(model, id);
        });
        return pickEntryFieldValues(entry);
    };
    return {
        getReviewerModel,
        getReviewer,
        async listReviewers(params) {
            const model = await getReviewerModel();

            const [entries, meta] = await security.withoutAuthorization(async () => {
                return cms.listLatestEntries(model, {
                    ...params,
                    where: {
                        ...params.where
                    }
                });
            });
            return [entries.map(pickEntryFieldValues<ApwReviewer>), meta];
        },
        async createReviewer(params) {
            const model = await getReviewerModel();
            const entry = await security.withoutAuthorization(async () => {
                return cms.createEntry(model, params.data);
            });
            return pickEntryFieldValues(entry);
        },
        async updateReviewer(params) {
            const model = await getReviewerModel();
            /**
             * We're fetching the existing entry here because we're not accepting "app" field as input,
             * but, we still need to retain its value after the "update" operation.
             */
            const existingEntry = await getReviewer({ id: params.id });

            const entry = await security.withoutAuthorization(async () => {
                return cms.updateEntry(model, params.id, {
                    ...existingEntry,
                    ...params.data,
                    savedOn: new Date()
                });
            });
            return pickEntryFieldValues(entry);
        },
        async deleteReviewer(params) {
            const model = await getReviewerModel();

            await security.withoutAuthorization(async () => {
                return cms.deleteEntry(model, params.id);
            });
            return true;
        }
    };
};
