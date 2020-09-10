import gql from "graphql-tag";
/*, $sortBy: String, $sortDirection: String*/

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
/*
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
`;*/

/*export const LIST_MENUS = gql`
    query ListPublishedPages(
        $category: String
        $sort: PbPageSortInput
        $tags: [String]
        $tagsRule: PbTagsRule
        $limit: Int
        $after: String
        $before: String
    ) {
        pageBuilder {
            listPublishedPages(
                category: $category
                sort: $sort
                tags: $tags
                tagsRule: $tagsRule
                limit: $limit
                after: $after
                before: $before
            ) {
                data {
                    id
                    title
                    url
                    fullUrl
                    snippet
                    publishedOn
                    settings {
                        general {
                            image {
                                src
                            }
                        }
                    }
                    createdBy {
                        firstName
                        lastName
                    }
                    category {
                        id
                        name
                    }
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
*/