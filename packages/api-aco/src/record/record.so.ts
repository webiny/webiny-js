import WebinyError from "@webiny/error";
import { SEARCH_RECORD_MODEL_ID } from "./record.model";
import { baseFields, CreateAcoStorageOperationsParams } from "~/createAcoStorageOperations";
import { createListSort } from "~/utils/createListSort";
import { createOperationsWrapper } from "~/utils/createOperationsWrapper";
import { getFieldValues } from "~/utils/getFieldValues";

import {
    AcoSearchRecordStorageOperations,
    StorageOperationsListSearchRecordTagsParams
} from "./record.types";
import { CmsModel } from "@webiny/api-headless-cms/types";

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
        listTags(params: StorageOperationsListSearchRecordTagsParams) {
            return withModel(async model => {
                const { where } = params;

                const [entries] = await cms.listLatestEntries(model, {
                    ...params,
                    where: {
                        ...(where || {})
                    }
                });

                const entryValues = entries.map(entry =>
                    getFieldValues(entry, ["id", "tags"], true)
                );

                const tags = entryValues
                    .reduce((collection, item) => {
                        const tags = Array.isArray(item.tags) ? item.tags : [];

                        for (const tag of tags) {
                            if (collection.find((item: string) => item === tag)) {
                                continue;
                            }
                            collection.push(tag);
                        }

                        return collection;
                    }, [] as string[])
                    .sort();

                //const tags: string[] = Object.keys(tagsObject).sort();

                const meta = {
                    hasMoreItems: false,
                    totalCount: tags.length,
                    cursor: null
                };

                return [tags, meta];
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
