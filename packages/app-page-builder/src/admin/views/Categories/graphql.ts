import gql from "graphql-tag";

const BASE_FIELDS = `
    slug
    name
    layout
    url
    createdOn
    createdBy {
        id
        displayName
    }
`;

export const LIST_CATEGORIES = gql`
    query ListCategories {
        pageBuilder {
            listCategories {
                data {
                    ${BASE_FIELDS}
                }
                error {
                    data
                    code
                    message
                }
            }
        }
    }
`;

export const GET_CATEGORY = gql`
    query GetCategory($slug: String!) {
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
    mutation CreateCategory($data: PbCategoryInput!){
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
    mutation UpdateCategory($slug: String!, $data: PbCategoryInput!){
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
    mutation DeleteCategory($slug: String!) {
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
