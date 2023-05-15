import WebinyError from "@webiny/error";
import { CreateAcoStorageOperationsParams } from "~/createAcoStorageOperations";
import { createListSort } from "~/utils/createListSort";
import { getRecordFieldValues } from "~/utils/getFieldValues";
import { AcoSearchRecordStorageOperations } from "./record.types";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { attachAcoRecordPrefix } from "~/utils/acoRecordId";

export const createSearchRecordOperations = (
    params: CreateAcoStorageOperationsParams
): AcoSearchRecordStorageOperations => {
    const { cms, security } = params;

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
        async getRecord(model, { id }) {
            return security.withoutAuthorization(async () => {
                const record = await getRecord(model, id);
                return getRecordFieldValues(record);
            });
        },
        listRecords(model, params) {
            return security.withoutAuthorization(async () => {
                const { sort, where } = params;

                const [entries, meta] = await cms.listLatestEntries(model, {
                    ...params,
                    sort: createListSort(sort),
                    where: {
                        ...(where || {})
                    }
                });

                return [entries.map(entry => getRecordFieldValues(entry)), meta];
            });
        },
        createRecord(model, { data: SearchRecordData }) {
            return security.withoutAuthorization(async () => {
                const { tags = [], data = {}, ...rest } = SearchRecordData;
                const entry = await cms.createEntry(model, {
                    tags,
                    data,
                    ...rest,
                    id: attachAcoRecordPrefix(rest.id)
                });

                return getRecordFieldValues(entry);
            });
        },
        updateRecord(this: AcoSearchRecordStorageOperations, model, { id, data }) {
            return security.withoutAuthorization(async () => {
                const original = await this.getRecord(model, { id });

                const input = {
                    ...original,
                    ...data
                };

                const entry = await cms.updateEntry(
                    model,
                    attachAcoRecordPrefix(original.id),
                    input
                );

                return getRecordFieldValues(entry);
            });
        },
        deleteRecord(model, { id }) {
            return security.withoutAuthorization(async () => {
                await cms.deleteEntry(model, attachAcoRecordPrefix(id));
                return true;
            });
        }
    };
};
