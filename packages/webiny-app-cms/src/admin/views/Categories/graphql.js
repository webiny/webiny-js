// @flow
import gql from "graphql-tag";

const fields = `
    id
    name
    slug
    url
    layout
`;

export const loadCategories = gql`
    query LoadCategories(
        $where: JSON
        $sort: JSON
        $page: Int
        $perPage: Int
        $search: SearchInput
    ) {
        cms {
            categories: listCategories(
                where: $where
                sort: $sort
                page: $page
                perPage: $perPage
                search: $search
            ) {
                data {
                    id
                    name
                    slug
                    url
                    createdOn
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
    }
`;

export const loadCategory = gql`
    query LoadCategory($id: ID!) {
        cms {
            category: getCategory(id: $id){
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

export const createCategory = gql`
    mutation CreateCategory($data: CategoryInput!){
        cms {
            category: createCategory(data: $data) {
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

export const updateCategory = gql`
    mutation UpdateCategory($id: ID!, $data: CategoryInput!){
        cms {
            category: updateCategory(id: $id, data: $data) {
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

export const deleteCategory = gql`
    mutation DeleteCategory($id: ID!) {
        cms {
            deleteCategory(id: $id) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;
