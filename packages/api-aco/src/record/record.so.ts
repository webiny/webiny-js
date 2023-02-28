import { attachCmsModelFieldConverters } from "@webiny/api-headless-cms/utils/converters/valueKeyStorageConverter";
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
    const { cms, security, getCmsContext } = params;
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

    const getRecord = async (id: string) => {
        const context = getCmsContext();
        const initialModel = await getRecordModel();

        const model = attachCmsModelFieldConverters({
            model: initialModel,
            plugins: context.plugins
        });

        /**
         * The record "id" has been passed by the original entry.
         * We need to retrieve it via `cms.storageOperations.entries.getLatestByIds()` method and return the first one.
         */
        const revisions = await cms.storageOperations.entries.getLatestByIds(model, { ids: [id] });

        if (revisions.length === 0) {
            throw new WebinyError("Record not found.", "NOT_FOUND", {
                id
            });
        }

        return revisions[0];
    };

    return {
        getRecordModel,
        async getRecord({ id }) {
            security.disableAuthorization();

            const record = await getRecord(id);

            security.enableAuthorization();

            return getFieldValues(record, baseFields, true);
        },
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
            return [entries.map(entry => getFieldValues(entry, baseFields, true)), meta];
        },
        async createRecord({ data }) {
            const model = await getRecordModel();
            security.disableAuthorization();

            const entry = await cms.createEntry(model, data);

            security.enableAuthorization();
            return getFieldValues(entry, baseFields, true);
        },
        async updateRecord({ id, data }) {
            const model = await getRecordModel();
            security.disableAuthorization();

            const original = await getRecord(id);

            const input = {
                ...original,
                ...data
            };

            const entry = await cms.updateEntry(model, original.id, input);
            security.enableAuthorization();
            return getFieldValues(entry, baseFields, true);
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
