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
    createdBy {
        firstName
        lastName
    }
`;

// Fetches data needed for constructing content models list in the main menu.
export const LIST_MENU_CONTENT_GROUPS_MODELS = gql`
    query HeadlessCmsListMenuContentGroupsModels {
        listContentModelGroups(sort: { name: 1 }, limit: 100) {
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
    query HeadlessCmsListContentModels($sort: JSON, $after: String, $before: String, $limit: Int) {
        listContentModels(sort: $sort, after: $after, before: $before, limit: $limit) {
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
    mutation CreateContentModel($data: CmsContentModelInput!) {
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

export const CREATE_REVISION_FROM = gql`
    mutation HeadlessCmsContentModelsCreateRevisionFrom($revision: ID!) {
        revision: createRevisionFrom(revision: $revision) {
            data {
                id
            }
            error {
                ${ERROR_FIELDS}
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
