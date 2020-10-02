import gql from "graphql-tag";

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
                    items
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