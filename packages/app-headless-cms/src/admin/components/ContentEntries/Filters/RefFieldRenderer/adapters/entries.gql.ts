import gql from "graphql-tag";

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

const DATA_FIELD = /* GraphQL */ `
    {
        id
        entryId
        title
        model {
            modelId
        }
    }
`;

export const SEARCH_CONTENT_ENTRIES = gql`
    query CmsSearchContentEntries($modelIds:[ID!]!, $query: String, $limit: Int) {
       searchContentEntries(modelIds: $modelIds, query: $query, limit: $limit) {
            data ${DATA_FIELD}
            error ${ERROR_FIELD}
        }
    }
`;

export const GET_CONTENT_ENTRY = gql`
    query CmsGetContentEntry($entry: CmsModelEntryInput!) {
       getLatestContentEntry(entry: $entry) {
            data ${DATA_FIELD}
            error ${ERROR_FIELD}
        }
    }
`;
