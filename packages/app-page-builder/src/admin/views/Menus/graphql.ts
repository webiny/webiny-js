import gql from "graphql-tag";

const BASE_FIELDS = `
    title
    slug
    description
    items
    createdBy {
        id
        displayName
    }
`;

export const LIST_MENUS = gql`
    query listMenus {
        pageBuilder {
            listMenus {
                data {
                    ${BASE_FIELDS}
                }
            }
        }
    }
`;

export const GET_MENU = gql`
    query getMenu($slug: String!) {
        pageBuilder {
            getMenu(slug: $slug){
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

export const CREATE_MENU = gql`
    mutation createMenu($data: PbMenuInput!){
        pageBuilder {
            menu: createMenu(data: $data) {
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

export const UPDATE_MENU = gql`
    mutation updateMenu($slug: String!, $data: PbMenuInput!){
        pageBuilder {
            menu: updateMenu(slug: $slug, data: $data) {
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

export const DELETE_MENU = gql`
    mutation deleteMenu($slug: String!) {
        pageBuilder {
            deleteMenu(slug: $slug) {
                error {
                    code
                    message
                }
            }
        }
    }
`;
