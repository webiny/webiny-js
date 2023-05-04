const SEARCH_DATA_FIELD = /* GraphQL */ `
    {
        id
        type
        title
        content
        location {
            folderId
        }
        data
        tags
        createdBy {
            id
            displayName
            type
        }
    }
`;

const TAG_DATA_FIELD = /* GraphQL */ `
    {
        tag
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
                data ${SEARCH_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_RECORD = /* GraphQL */ `
    mutation UpdateRecord($id: ID!, $data: SearchRecordUpdateInput!) {
        search {
            updateRecord(id: $id, data: $data) {
                data ${SEARCH_DATA_FIELD}
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
    query ListRecords($where: SearchRecordListWhereInput, $search: String, $limit: Int, $after: String, $sort: AcoSort) {
        search {
            listRecords(where: $where, search: $search, limit: $limit, after: $after, sort: $sort) {
                data ${SEARCH_DATA_FIELD}
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
                data ${SEARCH_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_TAGS = /* GraphQL */ `
    query ListTags($where: SearchRecordTagListWhereInput) {
        search {
            listTags(where: $where) {
                data ${TAG_DATA_FIELD}
                meta ${LIST_META_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
