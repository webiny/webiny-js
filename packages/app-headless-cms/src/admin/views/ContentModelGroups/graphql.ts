import gql from "graphql-tag";

const fields = `
    id
    name
    slug
    description
    icon
`;

export const LIST_CONTENT_MODEL_GROUPS = gql`
    query CmsListContentModelGroups {
        listContentModelGroups {
            data {
                ${fields}
                contentModels {
                    id
                    name
                }
            }
        }
    }
`;

export const GET_CONTENT_MODEL_GROUP = gql`
    query CmsGetContentModelGroup($id: ID!) {
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
    mutation CmsCreateContentModelGroup($data: CmsContentModelGroupInput!){
        contentModelGroup: createContentModelGroup(data: $data) {
            data {
                ${fields}
                contentModels {
                    id
                    name
                }
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
    mutation CmsUpdateContentModelGroup($id: ID!, $data: CmsContentModelGroupInput!){
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
    mutation CmsDeleteContentModelGroup($id: ID!) {
        deleteContentModelGroup(id: $id) {
            data
            error {
                code
                message
            }
        }
    }
`;
