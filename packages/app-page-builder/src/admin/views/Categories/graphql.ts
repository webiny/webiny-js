import gql from "graphql-tag";

const BASE_FIELDS = `
    slug
    name
    layout
    url
    createdBy {
        id
        displayName
    }
`;

export const LIST_CATEGORIES = gql`
    query listCategories {
        pageBuilder {
            listCategories {
                data {
                    ${BASE_FIELDS}
                }
            }
        }
    }
`;

export const GET_CATEGORY = gql`
    query getCategory($slug: String!) {
        pageBuilder {
            getCategory(slug: $slug){
                data {
                    ${BASE_FIELDS}
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

export const CREATE_CATEGORY = gql`
    mutation createCategory($data: PbCategoryInput!){
        pageBuilder {
            category: createCategory(data: $data) {
                data {
                    ${BASE_FIELDS}
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

export const UPDATE_CATEGORY = gql`
    mutation updateCategory($slug: String!, $data: PbCategoryInput!){
        pageBuilder {
            category: updateCategory(slug: $slug, data: $data) {
                data {
                    ${BASE_FIELDS}
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

export const DELETE_CATEGORY = gql`
    mutation deleteCategory($slug: String!) {
        pageBuilder {
            deleteCategory(slug: $slug) {
                error {
                    code
                    message
                }
            }
        }
    }
`;
