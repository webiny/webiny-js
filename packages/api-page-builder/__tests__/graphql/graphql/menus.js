export const DATA_FIELD = /* GraphQL */ `
    {
        slug
        description
        title
        items
        createdOn
        createdBy {
            id
            displayName
        }
    }
`;

export const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const CREATE_MENU = /* GraphQL */ `
    mutation CreateMenu($data: PbMenuInput!) {
        pageBuilder {
            createMenu(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_MENU = /* GraphQL */ `
    mutation UpdateMenu($slug: String!, $data: PbMenuInput!) {
        pageBuilder {
            updateMenu(slug: $slug, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_MENUS = /* GraphQL */ `
    query ListMenus {
        pageBuilder {
            listMenus {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_MENU = /* GraphQL */ `
    query GetMenu($slug: String!) {
        pageBuilder {
            getMenu(slug: $slug) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_MENU = /* GraphQL */ `
    mutation DeleteMenu($slug: String!) {
        pageBuilder {
            deleteMenu(slug: $slug) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
