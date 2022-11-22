const entryFields = `
    id
    entryId
    status
    title
    model {
        modelId
        name
    }
`;

export const GET_CONTENT_ENTRY_QUERY = /* GraphQL */ `
    query CmsGetContentEntry($entry: CmsModelEntryInput!) {
        getContentEntry(entry: $entry) {
            data {
                ${entryFields}
            }
            error {
                code
                message
            }
        }
    }
`;

export const GET_LATEST_CONTENT_ENTRY_QUERY = /* GraphQL */ `
    query CmsGetLatestContentEntry($entry: CmsModelEntryInput!) {
        getLatestContentEntry(entry: $entry) {
            data {
                ${entryFields}
            }
            error {
                code
                message
            }
        }
    }
`;
export const GET_PUBLISHED_CONTENT_ENTRY_QUERY = /* GraphQL */ `
    query CmsGetPublishedContentEntry($entry: CmsModelEntryInput!) {
        getPublishedContentEntry(entry: $entry) {
            data {
                ${entryFields}
            }
            error {
                code
                message
            }
        }
    }
`;

export const GET_CONTENT_ENTRIES_QUERY = /* GraphQL */ `
    query CmsGetContentEntries($entries: [CmsModelEntryInput!]!) {
        getContentEntries(entries: $entries) {
            data {
                ${entryFields}
            }
            error {
                code
                message
            }
        }
    }
`;

export const GET_LATEST_CONTENT_ENTRIES_QUERY = /* GraphQL */ `
    query CmsGetLatestContentEntries($entries: [CmsModelEntryInput!]!) {
        getLatestContentEntries(entries: $entries) {
            data {
                ${entryFields}
            }
            error {
                code
                message
            }
        }
    }
`;

export const GET_PUBLISHED_CONTENT_ENTRIES_QUERY = /* GraphQL */ `
    query CmsGetPublishedContentEntries($entries: [CmsModelEntryInput!]!) {
        getPublishedContentEntries(entries: $entries) {
            data {
                ${entryFields}
            }
            error {
                code
                message
            }
        }
    }
`;

export interface SearchContentEntriesVariables {
    modelsIds: string[];
    fields?: string[];
    query?: string;
    limit?: number;
}
export const SEARCH_CONTENT_ENTRIES_QUERY = /* GraphQL */ `
    query CmsSearchContentEntries(
        $modelsIds: [ID!]!
        $query: String
        $limit: Int
        $fields: [String!]
    ) {
        entries: searchContentEntries(
            modelIds: $modelsIds
            query: $query
            limit: $limit
            fields: $fields
        ) {
            data {
                id
                entryId
                status
                title
                model {
                    modelId
                    name
                }
                published {
                    id
                    entryId
                    title
                }
            }
            error {
                code
                message
                data
            }
        }
    }
`;
