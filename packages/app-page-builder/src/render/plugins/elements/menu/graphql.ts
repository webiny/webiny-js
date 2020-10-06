import gql from "graphql-tag";

const fields = `
    id
    title
    slug
    description
    items
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

export const LIST_MENUS = gql`
    query listMenus(
        $where: JSON
        $sort: JSON
        $limit: Int
        $after: String
        $before: String
    ) {
        pageBuilder {
            menus: listMenus(
                where: $where
                sort: $sort
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