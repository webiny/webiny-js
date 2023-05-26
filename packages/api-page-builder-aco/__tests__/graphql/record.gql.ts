const DATA_FIELD = (extra = "") => /* GraphQL */ `
    {
        id
        type
        title
        content
        tags
        location {
            folderId
        }
        data
        ${extra}
    }
`;

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const GET_RECORD = /* GraphQL */ `
    query GetRecord($id: ID!) {
        search {
            getRecord(id: $id ) {
                data ${DATA_FIELD()}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_RECORDS = /* GraphQL */ `
    query ListRecords {
        search {
            listRecords {
                data  ${DATA_FIELD()}
                error ${ERROR_FIELD}
                meta {
                    hasMoreItems
                    totalCount
                    cursor
                }
            }
        }
    }
`;
