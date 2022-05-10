import { ApwChangeRequestStorageOperations } from "./types";
import { baseFields, CreateApwStorageOperationsParams } from "~/storageOperations/index";
import { getFieldValues, getTransformer } from "~/utils/fieldResolver";
import WebinyError from "@webiny/error";
import { ApwChangeRequest } from "~/types";

export const createChangeRequestStorageOperations = ({
    cms,
    getCmsContext
}: CreateApwStorageOperationsParams): ApwChangeRequestStorageOperations => {
    const getChangeRequestModel = async () => {
        const model = await cms.getModel("apwChangeRequestModelDefinition");
        if (!model) {
            throw new WebinyError(
                "Could not find `apwWorkflowModelDefinition` model.",
                "MODEL_NOT_FOUND_ERROR"
            );
        }
        return model;
    };
    const getChangeRequest: ApwChangeRequestStorageOperations["getChangeRequest"] = async ({
        id
    }) => {
        const model = await getChangeRequestModel();
        const entry = await cms.getEntryById(model, id);
        return getFieldValues({
            entry,
            fields: baseFields,
            context: getCmsContext(),
            transformers: [getTransformer(model, "body")]
        });
    };
    return {
        getChangeRequestModel,
        getChangeRequest,
        async listChangeRequests(params) {
            const model = await getChangeRequestModel();
            const [entries, meta] = await cms.listLatestEntries(model, {
                ...params,
                where: {
                    ...params.where
                }
            });
            const all = await Promise.all(
                entries.map(entry =>
                    getFieldValues<ApwChangeRequest>({
                        entry,
                        fields: baseFields,
                        context: getCmsContext(),
                        transformers: [getTransformer(model, "body")]
                    })
                )
            );
            return [all, meta];
        },
        async createChangeRequest(params) {
            const model = await getChangeRequestModel();
            const entry = await cms.createEntry(model, params.data);
            return getFieldValues({
                entry,
                fields: baseFields,
                context: getCmsContext(),
                transformers: [getTransformer(model, "body")]
            });
        },
        async updateChangeRequest(params) {
            const model = await getChangeRequestModel();
            /**
             * We're fetching the existing entry here because we're not accepting "app" field as input,
             * but, we still need to retain its value after the "update" operation.
             */
            const existingEntry = await getChangeRequest({ id: params.id });

            const entry = await cms.updateEntry(model, params.id, {
                ...existingEntry,
                ...params.data
            });
            return getFieldValues({
                entry,
                fields: baseFields,
                context: getCmsContext(),
                transformers: [getTransformer(model, "body")]
            });
        },
        async deleteChangeRequest(params) {
            const model = await getChangeRequestModel();
            await cms.deleteEntry(model, params.id);
            return true;
        }
    };
};
