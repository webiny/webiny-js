// @flow
import gql from "graphql-tag";

const fields = `
    id
    name
    slug
    url
    layout
`;

export const LIST_CATEGORIES = gql`
    query PbLoadCategories(
        $where: JSON
        $sort: JSON
        $page: Int
        $perPage: Int
        $search: PbSearchInput
    ) {
        pageBuilder {
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

export const LIST_CATEGORIES_BY_NAME = gql`
    {
        pageBuilder {
            categories: listCategories(sort: { name: 1 }) {
                data {
                    id
                    name
                    slug
                    url
                }
            }
        }
    }
`;

export const READ_CATEGORY = gql`
    query PbLoadCategory($id: ID!) {
        pageBuilder {
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

export const CREATE_CATEGORY = gql`
    mutation PbCreateCategory($data: PbCategoryInput!){
        pageBuilder {
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

export const UPDATE_CATEGORY = gql`
    mutation PbUpdateCategory($id: ID!, $data: PbCategoryInput!){
        pageBuilder {
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

export const DELETE_CATEGORY = gql`
    mutation PbDeleteCategory($id: ID!) {
        pageBuilder {
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
