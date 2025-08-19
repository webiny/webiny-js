import omit from "lodash/omit";
import WebinyError from "@webiny/error";
import type { CreateAcoStorageOperationsParams } from "~/createAcoStorageOperations";
import { pickEntryFieldValues } from "~/utils/pickEntryFieldValues";
import type { AcoSearchRecordStorageOperations, SearchRecord } from "./record.types";
import type { CmsModel, UpdateCmsEntryInput } from "@webiny/api-headless-cms/types";
import { attachAcoRecordPrefix } from "~/utils/acoRecordId";
import { SEARCH_RECORD_MODEL_ID } from "~/record/record.model";
import { ENTRY_META_FIELDS, pickEntryMetaFields } from "@webiny/api-headless-cms/constants";

export const createSearchRecordOperations = (
    params: CreateAcoStorageOperationsParams
): AcoSearchRecordStorageOperations => {
    const { cms } = params;

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
            const record = await getRecord(model, id);
            return pickEntryFieldValues<SearchRecord<any>>(record);
        },
        async listRecords(model, params) {
            const { sort, where } = params;
            const [entries, meta] = await cms.listLatestEntries(model, {
                ...params,
                sort,
                where: {
                    ...(where || {})
                }
            });

            const items = entries.map(pickEntryFieldValues<SearchRecord<any>>);

            return [items, meta];
        },
        async listTags(model, params) {
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
        },
        async createRecord(model, { data: searchRecordData }) {
            const { tags = [], data = {}, ...rest } = searchRecordData;

            // We added this so that if the main record has its meta fields set with
            // custom values, we can propagate them to the search record as well.
            const { createdBy, createdOn, modifiedBy, modifiedOn, savedBy, savedOn } =
                pickEntryMetaFields(data);

            const input = {
                tags,
                data,
                ...rest,
                createdBy,
                createdOn,
                modifiedBy,
                modifiedOn,
                savedBy,
                savedOn,
                revisionCreatedBy: createdBy,
                revisionCreatedOn: createdOn,
                revisionModifiedBy: modifiedBy,
                revisionModifiedOn: modifiedOn,
                revisionSavedBy: savedBy,
                revisionSavedOn: savedOn,
                id: attachAcoRecordPrefix(rest.id)
            };

            const entry = await cms.createEntry(model, input);

            return pickEntryFieldValues<SearchRecord<any>>(entry);
        },
        async updateRecord(this: AcoSearchRecordStorageOperations, model, { id, data }) {
            const original = await this.getRecord(model, { id });
            const input = {
                /**
                 *  We are omitting the standard entry meta fields:
                 *  we don't want to override them with the ones coming from the `original` entry.
                 */
                ...omit(original, ENTRY_META_FIELDS),
                ...data
            };

            const entry = await cms.updateEntry(model, attachAcoRecordPrefix(original.id), input);

            return pickEntryFieldValues<SearchRecord<any>>(entry);
        },
        async moveRecord(this: AcoSearchRecordStorageOperations, model, params) {
            const { id, folderId } = params;
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
        },
        async deleteRecord(model, { id }) {
            await cms.deleteEntry(model, attachAcoRecordPrefix(id));
            return true;
        }
    };
};
