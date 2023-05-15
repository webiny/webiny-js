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
            title
            createdBy {
                id
                displayName
                type
            }
            createdOn
            version
            locked
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
    mutation CreateRecord($data: AcoSearchRecordWebinyInput!) {
        search {
            createRecord: createAcoSearchRecordWebiny(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_RECORD = /* GraphQL */ `
    mutation UpdateRecord($id: ID!, $data: AcoSearchRecordWebinyInput!) {
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
    query ListRecords($where: AcoSearchRecordWebinyListWhereInput, $search: String, $limit: Int, $after: String, $sort: AcoSort) {
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
