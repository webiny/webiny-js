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
        type
        location {
            folderId
        }
        title
        content
        data
        tags
        savedOn
    }
`;

const LIST_META_FIELD = /* GraphQL */ `
    {
        cursor
        totalCount
        hasMoreItems
    }
`;

export const CREATE_RECORD = gql`
    mutation CreateRecord($data: SearchRecordCreateInput!) {
        search {
            createRecord(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_RECORDS = gql`
    query ListRecords ($where: SearchRecordListWhereInput, $limit: Int, $after: String, $sort: AcoSort!, $search: String) {
        search {
            listRecords(where: $where, limit: $limit, after: $after, sort: $sort, search: $search) {
                data ${DATA_FIELD}
                meta ${LIST_META_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_RECORD = gql`
    query GetRecord ($id: ID!) {
        search {
            getRecord(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_RECORD = gql`
    mutation UpdateRecord($id: ID!, $data: SearchRecordUpdateInput!) {
        search {
            updateRecord(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_RECORD = gql`
    mutation DeleteRecord($id: ID!) {
        search {
            deleteRecord(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_TAGS = gql`
    query ListTags($type: String!) {
        search {
            listTags(where: { type: $type }) {
                data
                meta ${LIST_META_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
