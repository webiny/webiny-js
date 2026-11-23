import type { ApiSession } from "../../../support/apiSession.ts";
import { callGraphql, requireData } from "../../../support/callGraphql.ts";
import type { TestModel } from "../../../support/contentModel.ts";
import type { TestEntry } from "../../../support/entry.ts";

interface PublishData {
    publishEntry: {
        error: { code: string | null; message: string | null } | null;
    };
}

/** Publishes the entry revision through `publish<Model>`, for setup. Throws when refused. */
export const publishRevision = async (session: ApiSession, model: TestModel, entry: TestEntry) => {
    const query = /* GraphQL */ `
        mutation PublishEntry($revision: ID!) {
            publishEntry: publish${model.singularApiName}(revision: $revision) {
                error {
                    code
                    message
                }
            }
        }
    `;
    const result = await callGraphql<PublishData>(session, "cms/manage", query, {
        revision: entry.id
    });
    const error = requireData(result, `publish${model.singularApiName}`).publishEntry.error;
    if (error) {
        throw new Error(`publish${model.singularApiName} failed: ${error.code} ${error.message}`);
    }
};
