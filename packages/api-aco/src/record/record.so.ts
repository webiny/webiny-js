import WebinyError from "@webiny/error";
import { SEARCH_RECORD_MODEL_ID } from "./record.model";
import { baseFields, CreateAcoStorageOperationsParams } from "~/createAcoStorageOperations";
import { createListSort } from "~/utils/createListSort";
import { createOperationsWrapper } from "~/utils/createOperationsWrapper";
import { getRecordFieldValues } from "~/utils/getFieldValues";
import { AcoSearchRecordStorageOperations } from "./record.types";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { attachAcoRecordPrefix } from "~/utils/acoRecordId";

export const createSearchRecordOperations = (
    params: CreateAcoStorageOperationsParams
): AcoSearchRecordStorageOperations => {
    const { cms } = params;

    const { withModel } = createOperationsWrapper({
        ...params,
        modelName: SEARCH_RECORD_MODEL_ID
    });

    const getRecord = async (model: CmsModel, id: string) => {
        /**
         * The record "id" has been passed by the original entry.
         * We need to retrieve it via `cms.storageOperations.entries.getLatestByIds()` method and return the first one.
         */
        const revisions = await cms.storageOperations.entries.getLatestByIds(model, {
            ids: [attachAcoRecordPrefix(id)]
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
                return getRecordFieldValues(record, baseFields);
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

                return [entries.map(entry => getRecordFieldValues(entry, baseFields)), meta];
            });
        },
        listTags(params) {
            return withModel(async model => {
                const { where } = params;

                const items = await cms.getUniqueFieldValues(model, {
                    where: {
                        ...(where || {}),
                        latest: true
                    },
                    fieldId: "tags"
                });

                const tags = items
                    .map(item => ({ tag: item.value, count: item.count }))
                    .sort((a, b) => {
                        return a.tag < b.tag ? -1 : 1;
                    })
                    .sort((a, b) => {
                        return a.count > b.count ? -1 : 1;
                    });

                const meta = {
                    hasMoreItems: false,
                    totalCount: tags.length,
                    cursor: null
                };

                return [tags, meta];
            });
        },
        createRecord({ data: SearchRecordData }) {
            return withModel(async model => {
                const { tags = [], data = {}, ...rest } = SearchRecordData;
                const entry = await cms.createEntry(model, {
                    tags,
                    data,
                    ...rest,
                    id: attachAcoRecordPrefix(rest.id)
                });

                return getRecordFieldValues(entry, baseFields);
            });
        },
        updateRecord(this: AcoSearchRecordStorageOperations, { id, data }) {
            return withModel(async model => {
                const original = await this.getRecord({ id });

                const input = {
                    ...original,
                    ...data
                };

                const entry = await cms.updateEntry(
                    model,
                    attachAcoRecordPrefix(original.id),
                    input
                );

                return getRecordFieldValues(entry, baseFields);
            });
        },
        deleteRecord({ id }) {
            return withModel(async model => {
                await cms.deleteEntry(model, attachAcoRecordPrefix(id));
                return true;
            });
        }
    };
};
