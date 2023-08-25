import gql from "graphql-tag";
import { CmsErrorResponse } from "~/types";
import { CmsReferenceContentEntry } from "./types";

const fields = `
data {
    id
    entryId
    status
    title
    description
    image
    createdOn
    savedOn
    createdBy {
        id
        type
        displayName
    }
    modifiedBy {
        id
        type
        displayName
    }
    model {
        modelId
        name
    }
    published {
        id
        entryId
        title
    }
    wbyAco_location {
        folderId
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
        data: CmsReferenceContentEntry[];
        error: CmsErrorResponse | null;
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
        data: CmsReferenceContentEntry[];
        error: CmsErrorResponse | null;
    };
    published: {
        data: CmsReferenceContentEntry[];
        error: CmsErrorResponse | null;
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
        data: CmsReferenceContentEntry | null;
        error: CmsErrorResponse | null;
    };
    published: {
        data: CmsReferenceContentEntry | null;
        error: CmsErrorResponse | null;
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
