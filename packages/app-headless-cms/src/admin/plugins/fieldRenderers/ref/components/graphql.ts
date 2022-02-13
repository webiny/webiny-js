import gql from "graphql-tag";
import { CmsErrorResponse, CmsModel } from "~/types";

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
 * Common response
 */
export interface CmsEntryQueryResponseDataEntry {
    id: string;
    status: "published" | "draft";
    title: string;
    model: Pick<CmsModel, "modelId" | "name">;
}
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
        data: CmsEntryQueryResponseDataEntry[];
        error?: CmsErrorResponse;
    };
}
export interface CmsEntrySearchQueryVariables {
    modelIds: string[];
    query: string;
    limit?: number;
}
export const SEARCH_CONTENT_ENTRIES = gql`
    query CmsSearchContentEntries($modelIds: [ID!]!, $query: String!, $limit: Int) {
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
        data: CmsEntryQueryResponseDataEntry[];
        error?: CmsErrorResponse;
    };
}
export interface CmsEntryGetListVariables {
    entries: CmsEntryGetEntryVariable[];
}
export const GET_CONTENT_ENTRIES = gql`
    query CmsGetContentEntries($entries: [CmsModelEntryInput!]!) {
        content: getContentEntries(entries: $entries) {
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
        data: CmsEntryQueryResponseDataEntry;
        error?: CmsErrorResponse;
    };
}
export interface CmsEntryGetQueryVariables {
    entry: CmsEntryGetEntryVariable;
}

export const GET_CONTENT_ENTRY = gql`
    query CmsGetContentEntry($entry: CmsModelEntryInput!) {
        content: getContentEntry(entry: $entry) {
            ${fields}
        }
    }
`;

export const GET_CONTENT_MODELS = gql`
    query CmsGetContentModels {
        listContentModels {
            data {
                modelId
                titleFieldId
            }
        }
    }
`;
