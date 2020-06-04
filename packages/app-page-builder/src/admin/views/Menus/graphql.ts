import gql from "graphql-tag";

const fields = `
    id
    title
    slug
    description
    items
`;

export const LIST_MENUS = gql`
    query listMenus(
        $where: JSON
        $sort: JSON
        $search: PbSearchInput
        $limit: Int
        $after: String
        $before: String
    ) {
        pageBuilder {
            menus: listMenus(
                where: $where
                sort: $sort
                search: $search
                limit: $limit
                after: $after
                before: $before
            ) {
                data {
                    id
                    title
                    slug
                    description
                    createdOn
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
    }
`;

export const READ_MENU = gql`
    query getMenu($id: ID!) {
        pageBuilder {
            menu: getMenu(id: $id){
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

export const CREATE_MENU = gql`
    mutation createMenu($data: PbMenuInput!){
        pageBuilder {
            menu: createMenu(data: $data) {
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

export const UPDATE_MENU = gql`
    mutation updateMenu($id: ID!, $data: PbMenuInput!){
        pageBuilder {
            menu: updateMenu(id: $id, data: $data) {
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

export const DELETE_MENU = gql`
    mutation deleteMenu($id: ID!) {
        pageBuilder {
            deleteMenu(id: $id) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;
