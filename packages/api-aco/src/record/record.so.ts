import { CmsModel } from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";

import { SEARCH_RECORD_MODEL_ID } from "~/record/record.model";
import { baseFields, CreateAcoStorageOperationsParams } from "~/plugins/operations";
import { getFieldValues } from "~/utils/getFieldValues";

import { AcoSearchRecordStorageOperations as BaseAcoSearchRecordStorageOperations } from "~/types";

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

        const entry = await cms.getEntryById(model, id);

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

            await cms.deleteEntry(model, id);

            security.enableAuthorization();
            return true;
        }
    };
};
