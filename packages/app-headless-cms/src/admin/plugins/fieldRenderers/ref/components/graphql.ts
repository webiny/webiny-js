import gql from "graphql-tag";
import { CmsErrorResponse, CmsLatestContentEntry, CmsPublishedContentEntry } from "~/types";

const fields = `
data {
    id
    entryId
    status
    title
    model {
        modelId
        name
    }
}
error {
    code
    message
    data
}`;

/**
 * #########################
 * Common variables
 */
export interface CmsEntryGetEntryVariable {
    modelId: string;
    id: string;
}

/**
 * #########################
 * Search Entries Query Response
 */

export interface CmsEntrySearchQueryResponse {
    content: {
        data: CmsLatestContentEntry[];
        error?: CmsErrorResponse;
    };
}
export interface CmsEntrySearchQueryVariables {
    modelIds: string[];
    query?: string;
    limit?: number;
}
export const SEARCH_CONTENT_ENTRIES = gql`
    query CmsSearchContentEntries($modelIds: [ID!]!, $query: String, $limit: Int) {
        content: searchContentEntries(modelIds: $modelIds, query: $query, limit: $limit) {
            ${fields}
        }
    }
`;
/**
 * #########################
 * Get Entries Query Response
 */

export interface CmsEntryGetListResponse {
    latest: {
        data: CmsLatestContentEntry[];
        error?: CmsErrorResponse;
    };
    published: {
        data: CmsPublishedContentEntry[];
        error?: CmsErrorResponse;
    };
}
export interface CmsEntryGetListVariables {
    entries: CmsEntryGetEntryVariable[];
}
export const GET_CONTENT_ENTRIES = gql`
    query CmsGetContentEntries($entries: [CmsModelEntryInput!]!) {
        latest: getLatestContentEntries(entries: $entries) {
            ${fields}
        }
        published: getPublishedContentEntries(entries: $entries) {
            ${fields}
        }
    }
`;

/**
 * #########################
 * Get Entry Query Response
 */
export interface CmsEntryGetQueryResponse {
    latest: {
        data: CmsLatestContentEntry;
        error?: CmsErrorResponse;
    };
    published: {
        data: CmsPublishedContentEntry;
        error?: CmsErrorResponse;
    };
}
export interface CmsEntryGetQueryVariables {
    entry: CmsEntryGetEntryVariable;
}

export const GET_CONTENT_ENTRY = gql`
    query CmsGetContentEntry($entry: CmsModelEntryInput!) {
        latest: getLatestContentEntry(entry: $entry) {
            ${fields}
        }
        published: getPublishedContentEntry(entry: $entry) {
            ${fields}
        }
    }
`;
/**
 * Not used anywhere.
 * Remove if determined that is correct
 */
// export const GET_CONTENT_MODELS = gql`
//     query CmsGetContentModels {
//         listContentModels {
//             data {
//                 modelId
//                 titleFieldId
//             }
//         }
//     }
// `;
