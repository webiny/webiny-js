import type { ApiSession } from "../../../support/apiSession.ts";
import { callGraphql, requireData } from "../../../support/callGraphql.ts";
import type { TestModel } from "../../../support/contentModel.ts";
import type { TestEntry } from "../../../support/entry.ts";

interface CmsError {
    code: string | null;
    message: string | null;
}

interface ListDeletedData {
    deleted: {
        data: { entryId: string }[] | null;
        error: CmsError | null;
    };
}

interface TrashEntryData {
    trashEntry: {
        error: CmsError | null;
    };
}

/** Whether the entry is in the model's trash. */
export const isEntryInTrash = async (
    session: ApiSession,
    model: TestModel,
    entry: TestEntry
): Promise<boolean> => {
    const query = /* GraphQL */ `
        query ListDeleted($where: ${model.singularApiName}ListWhereInput) {
            deleted: listDeleted${model.pluralApiName}(where: $where, limit: 1) {
                data {
                    entryId
                }
                error {
                    code
                    message
                }
            }
        }
    `;
    const result = await callGraphql<ListDeletedData>(session, "cms/manage", query, {
        where: { entryId: entry.entryId }
    });
    const read = requireData(result, `listDeleted${model.pluralApiName}`).deleted;
    if (!read.data) {
        throw new Error(`listDeleted${model.pluralApiName} failed: ${read.error?.message}`);
    }
    return read.data.some(item => item.entryId === entry.entryId);
};

/**
 * Moves the entry to the trash through the API, for setup. Throws when refused. Without
 * `permanently: false` a delete skips the trash.
 */
export const moveEntryToTrash = async (session: ApiSession, model: TestModel, entry: TestEntry) => {
    const query = /* GraphQL */ `
        mutation TrashEntry($revision: ID!) {
            trashEntry: delete${model.singularApiName}(
                revision: $revision
                options: { permanently: false }
            ) {
                error {
                    code
                    message
                }
            }
        }
    `;
    const result = await callGraphql<TrashEntryData>(session, "cms/manage", query, {
        revision: entry.entryId
    });
    const error = requireData(result, `delete${model.singularApiName}`).trashEntry.error;
    if (error) {
        throw new Error(`delete${model.singularApiName} failed: ${error.code} ${error.message}`);
    }
};
