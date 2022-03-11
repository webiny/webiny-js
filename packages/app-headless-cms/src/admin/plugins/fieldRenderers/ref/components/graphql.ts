import gql from "graphql-tag";
import { CmsErrorResponse, CmsLatestContentEntry } from "~/types";

const fields = `
data {
    id
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
    content: {
        data: CmsLatestContentEntry[];
        error?: CmsErrorResponse;
    };
}
export interface CmsEntryGetListVariables {
    entries: CmsEntryGetEntryVariable[];
    latest?: boolean;
}
export const GET_CONTENT_ENTRIES = gql`
    query CmsGetContentEntries($entries: [CmsModelEntryInput!]!, $latest: Boolean) {
        content: getContentEntries(entries: $entries, latest: $latest) {
            ${fields}
        }
    }
`;

/**
 * #########################
 * Get Entry Query Response
 */
export interface CmsEntryGetQueryResponse {
    content: {
        data: CmsLatestContentEntry;
        error?: CmsErrorResponse;
    };
}
export interface CmsEntryGetQueryVariables {
    entry: CmsEntryGetEntryVariable;
    latest?: boolean;
}

export const GET_CONTENT_ENTRY = gql`
    query CmsGetContentEntry($entry: CmsModelEntryInput!, $latest: Boolean) {
        content: getContentEntry(entry: $entry, latest: $latest) {
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
