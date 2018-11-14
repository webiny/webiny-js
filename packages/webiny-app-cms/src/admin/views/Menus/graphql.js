// @flow
import gql from "graphql-tag";

const fields = `
    id
    title
    slug
    description
    items
`;

export const loadMenus = gql`
    query LoadMenus($where: JSON, $sort: JSON, $page: Int, $perPage: Int, $search: SearchInput) {
        cms {
            menus: listMenus(
                where: $where
                sort: $sort
                page: $page
                perPage: $perPage
                search: $search
            ) {
                data {
                    id
                    title
                    slug
                    description
                    createdOn
                }
                meta {
                    totalCount
                    totalPages
                    to
                    from
                    nextPage
                    previousPage
                }
            }
        }
    }
`;

export const loadMenu = gql`
    query LoadMenu($id: ID!) {
        cms {
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

export const createMenu = gql`
    mutation CreateMenu($data: MenuInput!){
        cms {
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

export const updateMenu = gql`
    mutation UpdateMenu($id: ID!, $data: MenuInput!){
        cms {
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

export const deleteMenu = gql`
    mutation DeleteMenu($id: ID!) {
        cms {
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
