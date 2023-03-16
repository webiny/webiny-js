import { attachCmsModelFieldConverters } from "@webiny/api-headless-cms/utils/converters/valueKeyStorageConverter";

import WebinyError from "@webiny/error";

import { SEARCH_RECORD_MODEL_ID } from "./record.model";
import { baseFields, CreateAcoStorageOperationsParams } from "~/createAcoStorageOperations";
import { createListSort } from "~/utils/createListSort";
import { createOperationsWrapper } from "~/utils/createOperationsWrapper";
import { getFieldValues } from "~/utils/getFieldValues";

import { AcoSearchRecordStorageOperations } from "./record.types";
import { CmsModel } from "@webiny/api-headless-cms/types";

export const createSearchRecordOperations = (
    params: CreateAcoStorageOperationsParams
): AcoSearchRecordStorageOperations => {
    const { cms, getCmsContext } = params;

    const { withModel } = createOperationsWrapper({
        ...params,
        modelName: SEARCH_RECORD_MODEL_ID
    });

    const getRecord = async (initialModel: CmsModel, id: string) => {
        const context = getCmsContext();

        const model = attachCmsModelFieldConverters({
            model: initialModel,
            plugins: context.plugins
        });

        /**
         * The record "id" has been passed by the original entry.
         * We need to retrieve it via `cms.storageOperations.entries.getLatestByIds()` method and return the first one.
         */
        const revisions = await cms.storageOperations.entries.getLatestByIds(model, {
            ids: [id]
        });

        if (revisions.length === 0) {
            throw new WebinyError("Record not found.", "NOT_FOUND", {
                id
            });
        }

        return revisions[0];
    };

    return {
        async getRecord({ id }) {
            return withModel(async model => {
                const record = await getRecord(model, id);
                return getFieldValues(record, baseFields, true);
            });
        },
        listRecords(params) {
            return withModel(async model => {
                const { sort, where } = params;

                const [entries, meta] = await cms.listLatestEntries(model, {
                    ...params,
                    sort: createListSort(sort),
                    where: {
                        ...(where || {})
                    }
                });

                return [entries.map(entry => getFieldValues(entry, baseFields, true)), meta];
            });
        },
        createRecord({ data }) {
            return withModel(async model => {
                const entry = await cms.createEntry(model, data);

                return getFieldValues(entry, baseFields, true);
            });
        },
        updateRecord({ id, data }) {
            return withModel(async model => {
                const original = await getRecord(model, id);

                const input = {
                    ...original,
                    ...data
                };

                const entry = await cms.updateEntry(model, original.id, input);

                return getFieldValues(entry, baseFields, true);
            });
        },
        deleteRecord({ id }) {
            return withModel(async model => {
                await cms.deleteEntry(model, id);
                return true;
            });
        }
    };
};
