import { CmsModel } from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";

import { SEARCH_RECORD_MODEL_ID } from "./record.model";
import { baseFields, CreateAcoStorageOperationsParams } from "~/createAcoStorageOperations";
import { getFieldValues } from "~/utils/getFieldValues";

import { AcoSearchRecordStorageOperations as BaseAcoSearchRecordStorageOperations } from "./record.types";

interface AcoSearchRecordStorageOperations extends BaseAcoSearchRecordStorageOperations {
    getRecordModel(): Promise<CmsModel>;
}

export const createSearchRecordOperations = (
    params: CreateAcoStorageOperationsParams
): AcoSearchRecordStorageOperations => {
    const { cms, security } = params;
    const getRecordModel = async () => {
        security.disableAuthorization();
        const model = await cms.getModel(SEARCH_RECORD_MODEL_ID);
        security.enableAuthorization();
        if (!model) {
            throw new WebinyError(
                `Could not find "${SEARCH_RECORD_MODEL_ID}" model.`,
                "MODEL_NOT_FOUND_ERROR"
            );
        }
        return model;
    };

    const getRecord: AcoSearchRecordStorageOperations["getRecord"] = async ({ id }) => {
        const model = await getRecordModel();
        security.disableAuthorization();

        /**
         * The record "id" is generated on creation.
         * Still, we need to get/update/delete records by the original entry id.
         */
        const entry = await cms.getEntryById(model, id);

        if (!entry) {
            throw new WebinyError("Could not load record.", "GET_ENTRY_ERROR", {
                id
            });
        }

        security.enableAuthorization();
        return getFieldValues(entry, baseFields);
    };

    return {
        getRecordModel,
        getRecord,
        async listRecords(params) {
            const model = await getRecordModel();
            security.disableAuthorization();

            const [entries, meta] = await cms.listLatestEntries(model, {
                ...params,
                where: {
                    ...(params.where || {})
                }
            });

            security.enableAuthorization();
            return [entries.map(entry => getFieldValues(entry, baseFields)), meta];
        },
        async createRecord({ data }) {
            const model = await getRecordModel();
            security.disableAuthorization();

            const entry = await cms.createEntry(model, data);

            security.enableAuthorization();
            return getFieldValues(entry, baseFields);
        },
        async updateRecord({ id, data }) {
            const model = await getRecordModel();
            security.disableAuthorization();

            const original = await getRecord({ id });

            const input = {
                ...original,
                ...data
            };

            const entry = await cms.updateEntry(model, id, input);
            security.enableAuthorization();
            return getFieldValues(entry, baseFields);
        },
        async deleteRecord({ id }) {
            const model = await getRecordModel();
            security.disableAuthorization();

            const entry = await getRecord({ id });

            await cms.deleteEntry(model, entry.id);

            security.enableAuthorization();
            return true;
        }
    };
};
