import gql from "graphql-tag";
//alter this for menu not page lists

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
export const loadMenus = gql`
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