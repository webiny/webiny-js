import gql from "graphql-tag";

const ERROR_FIELDS = `
    code
    message
    data
`;

const BASE_CONTENT_MODEL_FIELDS = `  
    id
    title
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
                    title
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
                title
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
    mutation DeleteForm($id: ID!) {
        cms {
            deleteForm(id: $id) {
                data
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
