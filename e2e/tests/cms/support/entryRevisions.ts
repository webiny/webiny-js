import type { ApiSession } from "../../../support/apiSession.ts";
import { callGraphql, requireData } from "../../../support/callGraphql.ts";
import type { TestModel } from "../../../support/contentModel.ts";

/** One revision of an entry: its version and status. */
export interface EntryRevision {
    id: string;
    version: number;
    status: string;
}

interface CmsError {
    code: string | null;
    message: string | null;
}

interface RevisionsData {
    revisions: {
        data: { id: string; meta: { version: number; status: string } }[] | null;
        error: CmsError | null;
    };
}

/** Lists every revision of the entry, oldest first. */
export const listEntryRevisions = async (
    session: ApiSession,
    model: TestModel,
    entryId: string
): Promise<EntryRevision[]> => {
    const query = /* GraphQL */ `
        query Revisions($id: ID!) {
            revisions: get${model.singularApiName}Revisions(id: $id) {
                data {
                    id
                    meta {
                        version
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
    const result = await callGraphql<RevisionsData>(session, "cms/manage", query, {
        id: entryId
    });
    const read = requireData(result, `get${model.singularApiName}Revisions`).revisions;
    if (!read.data) {
        throw new Error(`get${model.singularApiName}Revisions failed: ${read.error?.message}`);
    }
    return read.data
        .map(revision => ({
            id: revision.id,
            version: revision.meta.version,
            status: revision.meta.status
        }))
        .sort((left, right) => left.version - right.version);
};
