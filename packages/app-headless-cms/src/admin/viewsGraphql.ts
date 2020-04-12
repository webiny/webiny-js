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
        listContentModelGroups(sort: { name: 1 }, page: 1, perPage: 100) {
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
    query HeadlessCmsListContentModels($sort: JSON, $page: Int, $perPage: Int) {
        listContentModels(sort: $sort, page: $page, perPage: $perPage) {
            data {
                ${BASE_CONTENT_MODEL_FIELDS}
            }
            meta {
                totalCount
                to
                from
                nextPage
                previousPage
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
