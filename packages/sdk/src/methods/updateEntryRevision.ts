import type { CmsSdkConfig } from "../types.js";

/**
 * Entry values type.
 */
export interface CmsEntryValues {
    [key: string]: any;
}

/**
 * CMS identity.
 */
export interface CmsIdentity {
    /**
     * ID of the user.
     */
    id: string;
    /**
     * Full name of the user.
     */
    displayName: string;
    /**
     * Type of the user (admin, user).
     */
    type: string;
}

/**
 * Entry state.
 */
export interface IEntryState {
    state: string;
    workflowId: string;
    stepId: string;
    stepName: string;
}

/**
 * Update entry revision data.
 */
export interface UpdateCmsEntryData<TValues extends CmsEntryValues = CmsEntryValues> {
    /**
     * Revision-level meta fields.
     */
    revisionCreatedOn?: Date | string | null;
    revisionModifiedOn?: Date | string | null;
    revisionSavedOn?: Date | string | null;
    revisionDeletedOn?: Date | string | null;
    revisionRestoredOn?: Date | string | null;
    revisionFirstPublishedOn?: Date | string | null;
    revisionLastPublishedOn?: Date | string | null;
    revisionModifiedBy?: CmsIdentity | null;
    revisionCreatedBy?: CmsIdentity | null;
    revisionSavedBy?: CmsIdentity | null;
    revisionDeletedBy?: CmsIdentity | null;
    revisionRestoredBy?: CmsIdentity | null;
    revisionFirstPublishedBy?: CmsIdentity | null;
    revisionLastPublishedBy?: CmsIdentity | null;

    /**
     * Entry-level meta fields.
     */
    createdOn?: Date | string | null;
    modifiedOn?: Date | string | null;
    savedOn?: Date | string | null;
    deletedOn?: Date | string | null;
    restoredOn?: Date | string | null;
    firstPublishedOn?: Date | string | null;
    lastPublishedOn?: Date | string | null;
    createdBy?: CmsIdentity | null;
    modifiedBy?: CmsIdentity | null;
    savedBy?: CmsIdentity | null;
    deletedBy?: CmsIdentity | null;
    restoredBy?: CmsIdentity | null;
    firstPublishedBy?: CmsIdentity | null;
    lastPublishedBy?: CmsIdentity | null;

    location?: {
        folderId?: string | null;
    };

    values?: Partial<TValues>;
}

export interface UpdateEntryRevisionParams<TValues extends CmsEntryValues = CmsEntryValues> {
    modelId: string;
    revisionId: string;
    data: UpdateCmsEntryData<TValues>;
    fields: string[];
}

/**1`
 * Updates an existing entry revision in the CMS.
 *
 * @template TValues - Type of the entry data object returned (typically contains id and entryId, or additional fields if specified)
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for updating the entry revision
 * @param params.modelId - The model ID for the entry
 * @param params.revisionId - The revision ID of the entry to update (e.g., "123#0001")
 * @param params.data - The updated entry data
 * @param params.fields - Fields to include in the response. Use "values." prefix for entry values (e.g., "values.author.name") or specify top-level fields like "createdOn"
 * @returns The updated entry data
 */
export async function updateEntryRevision<TValues extends CmsEntryValues = CmsEntryValues>(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: UpdateEntryRevisionParams<TValues>
): Promise<UpdateCmsEntryData<TValues>> {
    const { modelId, revisionId, data, fields } = params;

    const { executeGraphQL } = await import("./executeGraphQL.js");

    const query = `
        mutation UpdateEntryRevision($modelId: ID!, $revisionId: ID!, $data: JSON!, $fields: [String!]!) {
            cms {
                updateEntryRevision(modelId: $modelId, revisionId: $revisionId, data: $data, fields: $fields) {
                    data
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const result = await executeGraphQL(config, fetchFn, query, {
        modelId,
        revisionId,
        data,
        fields
    });

    if (result.cms.updateEntryRevision.error) {
        throw new Error(result.cms.updateEntryRevision.error.message);
    }

    return result.cms.updateEntryRevision.data;
}
