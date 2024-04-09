import { ApwChangeRequestStorageOperations } from "./types";
import { CreateApwStorageOperationsParams } from "~/storageOperations/index";
import { baseFields } from "~/utils/pickEntryFieldValues";
import { getFieldValues, getTransformer } from "~/utils/fieldResolver";
import WebinyError from "@webiny/error";
import { ApwChangeRequest } from "~/types";

export const createChangeRequestStorageOperations = (
    params: CreateApwStorageOperationsParams
): ApwChangeRequestStorageOperations => {
    const { cms, getCmsContext, security } = params;
    const getChangeRequestModel = async () => {
        const model = await cms.getModel("apwChangeRequestModelDefinition");
        if (!model) {
            throw new WebinyError(
                "Could not find `apwChangeRequestModelDefinition` model.",
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

            try {
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
            } catch (ex) {
                throw new WebinyError(ex.message, ex.code, ex.data);
            }
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

            /**
             * Only creator can update the change request
             */
            if (existingEntry.createdBy.id !== security.getIdentity().id) {
                throw new WebinyError(
                    "A change request can only be updated by its creator.",
                    "ONLY_CREATOR_CAN_UPDATE_CHANGE_REQUEST"
                );
            }

            const entry = await cms.updateEntry(model, params.id, {
                ...existingEntry,
                ...params.data,
                savedOn: new Date()
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

            if (!security.getIdentity()) {
                return true;
            }

            /**
             * We're fetching the existing entry
             */
            const existingEntry = await getChangeRequest({ id: params.id });

            /**
             * Only creator can delete the change request
             */
            if (existingEntry.createdBy.id !== security.getIdentity().id) {
                throw new WebinyError(
                    "A change request can only be deleted by its creator.",
                    "ONLY_CREATOR_CAN_DELETE_CHANGE_REQUEST"
                );
            }

            await cms.deleteEntry(model, params.id);

            return true;
        }
    };
};
