import gql from "graphql-tag";

const ERROR_FIELDS = `
    code
    message
    data
`;

const BASE_CONTENT_MODEL_FIELDS = `
    id
    name
    savedOn
`;

// Fetches data needed for constructing content models list in the main menu.
export const LIST_MENU_CONTENT_GROUPS_MODELS = gql`
    query CmsListMenuContentGroupsModels {
        listContentModelGroups {
            data {
                id
                name
                icon
                contentModels {
                    name
                    modelId
                    id
                }
            }
        }
    }
`;

export const LIST_CONTENT_MODELS = gql`
    query CmsListContentModels {
        listContentModels {
            data {
                ${BASE_CONTENT_MODEL_FIELDS}
                modelId
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

export const CREATE_CONTENT_MODEL = gql`
    mutation CmsCreateContentModel($data: CmsContentModelInput!) {
        createContentModel(data: $data) {
            data {
                id
                name
                description
                modelId
            }
            error {
                message
                data
            }
        }
    }
`;

export const DELETE_CONTENT_MODEL = gql`
    mutation HeadlessCmsDeleteContentModel($id: ID!) {
        deleteContentModel(id: $id) {
            data
            error {
                ${ERROR_FIELDS}
            }
        }
    }
`;
