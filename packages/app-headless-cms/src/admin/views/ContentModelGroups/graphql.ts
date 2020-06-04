import gql from "graphql-tag";

const fields = `
    id
    name
    slug
    description
    icon
`;

export const LIST_CONTENT_MODEL_GROUPS = gql`
    query ListContentModelGroups(
        $where: JSON
        $sort: JSON
        $search: CmsSearchInput
        $limit: Int
        $after: String
        $before: String
    ) {
        contentModelGroups: listContentModelGroups(
            where: $where
            sort: $sort
            search: $search
            limit: $limit
            after: $after
            before: $before
        ) {
            data {
                id
                name
                totalContentModels
            }
            meta {
                cursors {
                    next
                    previous
                }
                hasNextPage
                hasPreviousPage
                totalCount
            }
        }
    }
`;

export const GET_CONTENT_MODEL_GROUP = gql`
    query GetContentModelGroup($id: ID!) {
        contentModelGroup: getContentModelGroup(id: $id){
            data {
                ${fields}
            }
            error {
                code
                message
            }
        }
    }
`;

export const CREATE_CONTENT_MODEL_GROUP = gql`
    mutation CreateContentModelGroup($data: CmsContentModelGroupInput!){
        contentModelGroup: createContentModelGroup(data: $data) {
            data {
                ${fields}
            }
            error {
                code
                message
                data
            }
        }
    }
`;

export const UPDATE_CONTENT_MODEL_GROUP = gql`
    mutation UpdateContentModelGroup($id: ID!, $data: CmsContentModelGroupInput!){
        contentModelGroup: updateContentModelGroup(id: $id, data: $data) {
            data {
                ${fields}
            }
            error {
                code
                message
                data
            }
        }
    }
`;

export const DELETE_CONTENT_MODEL_GROUP = gql`
    mutation DeleteContentModelGroup($id: ID!) {
        deleteContentModelGroup(id: $id) {
            data
            error {
                code
                message
            }
        }
    }
`;
