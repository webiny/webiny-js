const DATA_FIELD = (extra = "") => /* GraphQL */ `
    {
        id
        type
        title
        content
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

const LIST_META_FIELD = /* GraphQL */ `
    {
        cursor
        totalCount
        hasMoreItems
    }
`;

export const CREATE_RECORD = /* GraphQL */ `
    mutation CreateRecord($data: SearchRecordCreateInput!) {
        search {
            createRecord(data: $data) {
                data ${DATA_FIELD()}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_RECORD = /* GraphQL */ `
    mutation UpdateRecord($id: ID!, $data: SearchRecordUpdateInput!) {
        search {
            updateRecord(id: $id, data: $data) {
                data ${DATA_FIELD()}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_RECORD = /* GraphQL */ `
    mutation DeleteRecord($id: ID!) {
        search {
            deleteRecord(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_RECORDS = /* GraphQL */ `
    query ListRecords($where: SearchRecordListWhereInput, $search: String, $limit: Int, $after: String, $sort: [AcoListSort]) {
        search {
            listRecords(where: $where, search: $search, limit: $limit, after: $after, sort: $sort) {
                data ${DATA_FIELD()}
                meta ${LIST_META_FIELD}
                error ${ERROR_FIELD}
            }
        }
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
