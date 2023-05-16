const DATA_FIELD = /* GraphQL */ `
    {
        id
        type
        title
        content
        location {
            folderId
        }
        data {
            someText
            identity {
                id
                displayName
                type
            }
            customCreatedOn
            customVersion
            customLocked
        }
        tags
    }
`;

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

const LIST_META_FIELD = /* GraphQL */ `
    {
        cursor
        totalCount
        hasMoreItems
    }
`;

export const CREATE_RECORD = /* GraphQL */ `
    mutation CreateRecord($data: AcoSearchRecordWebinyCreateInput!) {
        search {
            createRecord: createAcoSearchRecordWebiny(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_RECORD = /* GraphQL */ `
    mutation UpdateRecord($id: ID!, $data: AcoSearchRecordWebinyUpdateInput!) {
        search {
            updateRecord: updateAcoSearchRecordWebiny(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_RECORD = /* GraphQL */ `
    mutation DeleteRecord($id: ID!) {
        search {
            deleteRecord: deleteAcoSearchRecordWebiny(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_RECORDS = /* GraphQL */ `
    query ListRecords($where: AcoSearchRecordWebinyListWhereInput, $search: String, $limit: Int, $after: String, $sort: [AcoSearchRecordWebinyListSorter!]) {
        search {
            listRecords: listAcoSearchRecordWebiny(where: $where, search: $search, limit: $limit, after: $after, sort: $sort) {
                data ${DATA_FIELD}
                meta ${LIST_META_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_RECORD = /* GraphQL */ `
    query GetRecord($id: ID!) {
        search {
            getRecord: getAcoSearchRecordWebiny(id: $id ) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
