import { gql } from "graphql-request";

export const CREATE_PAGE = gql`
    mutation CreatePage($category: String!) {
        pageBuilder {
            createPage(category: $category) {
                data {
                    id
                }
            }
        }
    }
`;

export const UPDATE_PAGE = gql`
    mutation UpdatePage($id: ID!, $data: PbUpdatePageInput!) {
        pageBuilder {
            updatePage(id: $id, data: $data) {
                data {
                    id
                }
            }
        }
    }
`;

export const PUBLISH_PAGE = gql`
    mutation PublishPage($id: ID!) {
        pageBuilder {
            publishPage(id: $id) {
                data {
                    id
                }
            }
        }
    }
`;

export const DELETE_PAGE = gql`
    mutation DeletePage($id: ID!) {
        pageBuilder {
            deletePage(id: $id) {
                error {
                    message
                    data
                    code
                }
            }
        }
    }
`;

const MENU_BASE_FIELDS = `
    title
    slug
    description
    items
    createdOn
    createdBy {
        id
        displayName
    }
`;

const ERROR_FIELDS = `
    code
    data
    message
`;

export const CREATE_MENU = gql`
    mutation createMenu($data: PbMenuInput!){
        pageBuilder {
            menu: createMenu(data: $data) {
                data {
                    ${MENU_BASE_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

export const DELETE_MENU = gql`
    mutation deleteMenu($slug: String!) {
        pageBuilder {
            menu: deleteMenu(slug: $slug) {
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

const BASE_FIELDS_CATEGORY = `
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

export const CREATE_CATEGORY = gql`
    mutation CreateCategory($data: PbCategoryInput!){
        pageBuilder {
            category: createCategory(data: $data) {
                data {
                    ${BASE_FIELDS_CATEGORY}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

export const DELETE_CATEGORY = gql`
    mutation DeleteCategory($slug: String!) {
        pageBuilder {
            category: deleteCategory(slug: $slug) {
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
