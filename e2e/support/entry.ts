import type { ApiSession } from "./apiSession.ts";
import { callGraphql, requireData } from "./callGraphql.ts";
import type { TestModel } from "./contentModel.ts";

/** A draft entry of a test model: its revision id (`<entryId>#0001`) and entry id. */
export interface TestEntry {
    id: string;
    entryId: string;
}

interface CmsError {
    code: string | null;
    message: string | null;
}

interface CreateEntryData {
    createEntry: {
        data: TestEntry | null;
        error: CmsError | null;
    };
}

interface DeleteEntryData {
    deleteEntry: {
        error: CmsError | null;
    };
}

/** Field values of an entry besides its title, by field id: `{ price: 10 }`. */
export type EntryValues = Record<string, unknown>;

/** Creates a draft entry with `title` and any other `values`. */
export const createDraftEntry = async (
    session: ApiSession,
    model: TestModel,
    title: string,
    values: EntryValues = {}
): Promise<TestEntry> => {
    const query = /* GraphQL */ `
        mutation CreateEntry($data: ${model.singularApiName}Input!) {
            createEntry: create${model.singularApiName}(data: $data) {
                data {
                    id
                    entryId
                }
                error {
                    code
                    message
                }
            }
        }
    `;
    const result = await callGraphql<CreateEntryData>(session, "cms/manage", query, {
        // Field values sit under `values`, beside the entry's system fields.
        data: { values: { ...values, title } }
    });
    const created = requireData(result, `create${model.singularApiName}`).createEntry;
    if (!created.data) {
        throw new Error(`create${model.singularApiName} failed: ${created.error?.message}`);
    }
    return created.data;
};

/**
 * Deletes every revision of the entry permanently, past the trash bin, so its model can be deleted.
 * Returns the error message, or null when it is gone.
 */
export const deleteEntryPermanently = async (
    session: ApiSession,
    model: TestModel,
    entry: TestEntry
): Promise<string | null> => {
    const query = /* GraphQL */ `
        mutation DeleteEntry($revision: ID!) {
            deleteEntry: delete${model.singularApiName}(
                revision: $revision
                options: { permanently: true }
            ) {
                error {
                    code
                    message
                }
            }
        }
    `;
    const result = await callGraphql<DeleteEntryData>(session, "cms/manage", query, {
        revision: entry.entryId
    });
    return result.errors?.[0]?.message ?? result.data?.deleteEntry.error?.message ?? null;
};

interface GetEntryData {
    getEntry: {
        data: { meta: { status: string | null } | null } | null;
        error: CmsError | null;
    };
}

/** The status of the entry revision: `draft`, `published`, `unpublished` and so on. */
export const getEntryStatus = async (
    session: ApiSession,
    model: TestModel,
    entry: TestEntry
): Promise<string | null> => {
    const query = /* GraphQL */ `
        query GetEntry($revision: ID!) {
            getEntry: get${model.singularApiName}(revision: $revision) {
                data {
                    meta {
                        status
                    }
                }
                error {
                    code
                    message
                }
            }
        }
    `;
    const result = await callGraphql<GetEntryData>(session, "cms/manage", query, {
        revision: entry.id
    });
    const read = requireData(result, `get${model.singularApiName}`).getEntry;
    if (read.error) {
        throw new Error(`get${model.singularApiName} failed: ${read.error.message}`);
    }
    return read.data?.meta?.status ?? null;
};
