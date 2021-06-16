import gql from "graphql-tag";

const ERROR_FIELDS = `
    code
    message
    data
`;

const BASE_CONTENT_MODEL_FIELDS = `
    description
    modelId
    name
    savedOn
    fields {
        id
    }
    group {
        id
        name
    }
    createdBy {
        id
        displayName
        type
    }
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
                    createdBy {
                        id
                        displayName
                        type
                    }
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
            }
        }
    }
`;

export const CREATE_CONTENT_MODEL = gql`
    mutation CmsCreateContentModel($data: CmsContentModelCreateInput!) {
        createContentModel(data: $data) {
            data {
                ${BASE_CONTENT_MODEL_FIELDS}
            }
            error {
                message
                data
            }
        }
    }
`;

export const DELETE_CONTENT_MODEL = gql`
    mutation CmsDeleteContentModel($modelId: ID!) {
        deleteContentModel(modelId: $modelId) {
            data
            error {
                ${ERROR_FIELDS}
            }
        }
    }
`;
