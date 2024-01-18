import omit from "lodash/omit";
import WebinyError from "@webiny/error";
import { CreateAcoStorageOperationsParams } from "~/createAcoStorageOperations";
import { pickEntryFieldValues } from "~/utils/pickEntryFieldValues";
import { AcoSearchRecordStorageOperations, SearchRecord } from "./record.types";
import { CmsModel, UpdateCmsEntryInput } from "@webiny/api-headless-cms/types";
import { attachAcoRecordPrefix } from "~/utils/acoRecordId";
import { SEARCH_RECORD_MODEL_ID } from "~/record/record.model";
import { ENTRY_META_FIELDS } from "@webiny/api-headless-cms/constants";

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
                return pickEntryFieldValues<SearchRecord<any>>(record);
            });
        },
        listRecords(model, params) {
            return security.withoutAuthorization(async () => {
                const { sort, where } = params;

                const [entries, meta] = await cms.listLatestEntries(model, {
                    ...params,
                    sort,
                    where: {
                        ...(where || {})
                    }
                });

                return [entries.map(pickEntryFieldValues<SearchRecord<any>>), meta];
            });
        },
        listTags(model, params) {
            return security.withoutAuthorization(async () => {
                const { where } = params;

                const items = await cms.getUniqueFieldValues(model, {
                    where: {
                        ...(where || {}),
                        latest: true
                    },
                    fieldId: "tags"
                });

                const meta = {
                    hasMoreItems: false,
                    totalCount: items.length,
                    cursor: null
                };

                const tags = items.map(item => {
                    return {
                        tag: item.value,
                        count: item.count
                    };
                });

                return [tags, meta];
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

                return pickEntryFieldValues<SearchRecord<any>>(entry);
            });
        },
        updateRecord(this: AcoSearchRecordStorageOperations, model, { id, data }) {
            return security.withoutAuthorization(async () => {
                const original = await this.getRecord(model, { id });

                const input = {
                    ...omit(original, ENTRY_META_FIELDS),
                    ...data
                };

                const entry = await cms.updateEntry(
                    model,
                    attachAcoRecordPrefix(original.id),
                    input
                );

                return pickEntryFieldValues<SearchRecord<any>>(entry);
            });
        },
        moveRecord(this: AcoSearchRecordStorageOperations, model, params) {
            const { id, folderId } = params;
            return security.withoutAuthorization(async () => {
                const original = await this.getRecord(model, { id });

                const input: UpdateCmsEntryInput = {
                    wbyAco_location: {
                        folderId
                    }
                };
                /**
                 * We only apply the location to the search record model as we do not want to override the users data.
                 */
                const lookFor = `${SEARCH_RECORD_MODEL_ID}-`;
                if (model.modelId.substring(0, lookFor.length) === lookFor) {
                    input.location = {
                        folderId
                    };
                }

                await cms.updateEntry(model, attachAcoRecordPrefix(original.id), input);

                return true;
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
