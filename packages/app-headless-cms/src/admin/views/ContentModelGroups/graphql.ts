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
        $page: Int
        $perPage: Int
        $search: CmsSearchInput
    ) {
        cmsManage {
            contentModelGroups: listContentModelGroups(
                where: $where
                sort: $sort
                page: $page
                perPage: $perPage
                search: $search
            ) {
                data {
                    id
                    name
                    totalContentModels
                }
                meta {
                    totalCount
                    totalPages
                    to
                    from
                    nextPage
                    previousPage
                }
            }
        }
    }
`;

export const GET_CONTENT_MODEL_GROUP = gql`
    query GetContentModelGroup($id: ID!) {
        cmsManage {
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
    }
`;

export const CREATE_CONTENT_MODEL_GROUP = gql`
    mutation CreateContentModelGroup($data: CmsContentModelGroupInput!){
        cmsManage {
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
    }
`;

export const UPDATE_CONTENT_MODEL_GROUP = gql`
    mutation UpdateContentModelGroup($id: ID!, $data: CmsContentModelGroupInput!){
        cmsManage {
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
    }
`;

export const DELETE_CONTENT_MODEL_GROUP = gql`
    mutation DeleteContentModelGroup($id: ID!) {
        cmsManage {
            deleteContentModelGroup(id: $id) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;
