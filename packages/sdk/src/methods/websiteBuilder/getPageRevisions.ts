import { Result } from "../../Result.js";
import { createMethod } from "../../utils/createMethod.js";
import { getPageRevisionsSchema } from "./schemas.js";
import { executeWbOperation } from "./executeWbOperation.js";
import type { WbPageRevision } from "./websiteBuilderTypes.js";

export interface GetPageRevisionsParams {
    entryId: string;
}

const SELECTION = `
                        id
                        entryId
                        version
                        title
                        status
                        locked
                        savedOn
                        createdOn
                        createdBy {
                            id
                            displayName
                            type
                        }
                        revisionDescription`;

export const getPageRevisions = createMethod(
    getPageRevisionsSchema,
    async (config, fetchFn, params) => {
        const { entryId } = params as GetPageRevisionsParams;
        const result = await executeWbOperation<WbPageRevision[]>(config, fetchFn, {
            type: "query",
            operation: "getPageRevisions",
            variableDefinitions: "$entryId: ID!",
            args: "entryId: $entryId",
            selection: SELECTION,
            variables: { entryId }
        });
        return result.isFail() ? Result.fail(result.error) : Result.ok(result.value.data ?? []);
    }
);
