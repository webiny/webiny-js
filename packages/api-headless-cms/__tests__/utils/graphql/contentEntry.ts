export const GET_CONTENT_ENTRY_QUERY = /* GraphQL */ `
    query CmsGetContentEntry($entry: CmsModelEntryInput!) {
        getContentEntry(entry: $entry) {
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
        }
    }
`;
export const GET_CONTENT_ENTRIES_QUERY = /* GraphQL */ `
    query CmsGetContentEntries($entries: [CmsModelEntryInput!]!) {
        getContentEntries(entries: $entries) {
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
        }
    }
`;
