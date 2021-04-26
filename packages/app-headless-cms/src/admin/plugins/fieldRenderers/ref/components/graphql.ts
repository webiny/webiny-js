import gql from "graphql-tag";

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
}
`;

export const SEARCH_CONTENT_ENTRIES = gql`
    query CmsSearchContentEntries($modelIds: [ID!]!, $query: String!, $limit: Int) {
        content: searchContentEntries(modelIds: $modelIds, query: $query, limit: $limit) {
            ${fields}
        }
    }
`;

export const GET_CONTENT_ENTRIES = gql`
    query CmsGetContentEntries($entries: [CmsModelEntryInput!]!) {
        content: getContentEntries(entries: $entries) {
            ${fields}
        }
    }
`;

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
