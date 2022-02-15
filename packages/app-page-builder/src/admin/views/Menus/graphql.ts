import gql from "graphql-tag";
interface MenuDataError {
    message: string;
    code: string;
    data: Record<string, any>;
}
export interface MenuData {
    title: string;
    slug: string;
    description: string;
    items: Record<string, any>[];
    createdOn: string;
    createdBy: {
        id: string;
        displayName: string;
    };
}
const BASE_FIELDS = `
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
/**
 * #########################
 * Get Menu Query Response
 */
export interface GetMenuQueryResponse {
    pageBuilder: {
        getMenu: {
            data: MenuData | null;
            error: MenuDataError | null;
        };
    };
}
export interface GetMenuQueryVariables {
    slug: string;
}
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
