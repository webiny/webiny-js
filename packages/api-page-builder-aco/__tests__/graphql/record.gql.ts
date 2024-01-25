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
        data {
            id
            pid
            title
            createdBy {
                id
                displayName
                type
            }
            createdOn
            savedOn
            status
            version
            locked
            path
        }
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
            getRecord: getAcoSearchRecordPb(id: $id ) {
                data ${DATA_FIELD()}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_RECORDS = /* GraphQL */ `
    query ListRecords($where:AcoSearchRecordPbListWhereInput) {
        search {
            listRecords: listAcoSearchRecordPb(where:$where) {
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
