import type { ApiSession } from "../../../support/apiSession.ts";
import { callGraphql, requireData } from "../../../support/callGraphql.ts";
import type { TestModel } from "../../../support/contentModel.ts";

/** The latest revision of an entry, as the API reads it outside the trash. */
export interface EntryRecord {
    id: string;
    status: string | null;
    version: number | null;
    folderId: string | null;
}

interface CmsError {
    code: string | null;
    message: string | null;
}

interface GetEntryData {
    getEntry: {
        data: {
            id: string;
            meta: { status: string | null; version: number | null } | null;
            wbyAco_location: { folderId: string | null } | null;
        } | null;
        error: CmsError | null;
    };
}

/** Reads the entry's latest revision, or null when there is none outside the trash. */
export const readEntryRecord = async (
    session: ApiSession,
    model: TestModel,
    entryId: string
): Promise<EntryRecord | null> => {
    const query = /* GraphQL */ `
        query GetEntry($entryId: ID!) {
            getEntry: get${model.singularApiName}(entryId: $entryId) {
                data {
                    id
                    meta {
                        status
                        version
                    }
                    wbyAco_location {
                        folderId
                    }
                }
                error {
                    code
                    message
                }
            }
        }
    `;
    const result = await callGraphql<GetEntryData>(session, "cms/manage", query, { entryId });
    const read = requireData(result, `get${model.singularApiName}`).getEntry;
    // A trashed or deleted entry is answered with no data and no error, or with NOT_FOUND.
    if (read.error?.code === "NOT_FOUND" || (!read.error && !read.data)) {
        return null;
    }
    if (read.error || !read.data) {
        throw new Error(`get${model.singularApiName} failed: ${read.error?.message}`);
    }
    return {
        id: read.data.id,
        status: read.data.meta?.status ?? null,
        version: read.data.meta?.version ?? null,
        folderId: read.data.wbyAco_location?.folderId ?? null
    };
};
