import type { CmsSdkConfig } from "../types.js";

/**
 * Entry values type.
 */
export interface CmsEntryValues {
    [key: string]: any;
}

/**
 * Entry status type.
 */
export type CmsEntryStatus = "published" | "unpublished" | "draft";

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
 * CMS entry data returned from queries.
 */
export interface CmsEntryData<TValues extends CmsEntryValues = CmsEntryValues> {
    id?: string;
    entryId?: string;
    status?: CmsEntryStatus;

    /**
     * Entry-level meta fields.
     */
    createdOn?: Date | string;
    modifiedOn?: Date | string | null;
    savedOn?: Date | string;
    deletedOn?: Date | string | null;
    restoredOn?: Date | string | null;
    createdBy?: CmsIdentity;
    modifiedBy?: CmsIdentity;
    savedBy?: CmsIdentity;
    deletedBy?: CmsIdentity | null;
    restoredBy?: CmsIdentity | null;
    firstPublishedOn?: Date | string;
    lastPublishedOn?: Date | string;
    firstPublishedBy?: CmsIdentity;
    lastPublishedBy?: CmsIdentity;

    /**
     * Revision-level meta fields.
     */
    revisionCreatedOn?: Date | string;
    revisionModifiedOn?: Date | string | null;
    revisionSavedOn?: Date | string;
    revisionDeletedOn?: Date | string | null;
    revisionRestoredOn?: Date | string | null;
    revisionCreatedBy?: CmsIdentity;
    revisionModifiedBy?: CmsIdentity | null;
    revisionSavedBy?: CmsIdentity;
    revisionDeletedBy?: CmsIdentity | null;
    revisionRestoredBy?: CmsIdentity | null;
    revisionFirstPublishedOn?: Date | string;
    revisionLastPublishedOn?: Date | string;
    revisionFirstPublishedBy?: CmsIdentity;
    revisionLastPublishedBy?: CmsIdentity;

    location?: {
        folderId?: string | null;
    };

    values?: TValues;
}

export interface PublishEntryRevisionParams {
    modelId: string;
    revisionId: string;
    fields: string[];
}

/**
 * Publishes an entry revision in the CMS.
 *
 * @template TValues - Type of the entry values object
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for publishing the entry revision
 * @param params.modelId - The model ID of the entry to publish
 * @param params.revisionId - The revision ID of the entry to publish (e.g., "123#0001")
 * @param params.fields - Fields to include in response. Use "values." prefix for entry values (e.g., "values.author.name")
 * @returns The published entry data
 */
export async function publishEntryRevision<TValues extends CmsEntryValues = CmsEntryValues>(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: PublishEntryRevisionParams
): Promise<CmsEntryData<TValues>> {
    const { modelId, revisionId, fields } = params;

    const { executeGraphQL } = await import("./executeGraphQL.js");

    const query = `
        mutation PublishEntryRevision($modelId: ID!, $revisionId: ID!, $fields: [String!]!) {
            cms {
                publishEntryRevision(modelId: $modelId, revisionId: $revisionId, fields: $fields) {
                    data
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const data = await executeGraphQL(config, fetchFn, query, { modelId, revisionId, fields });

    if (data.cms.publishEntryRevision.error) {
        throw new Error(data.cms.publishEntryRevision.error.message);
    }

    return data.cms.publishEntryRevision.data;
}
