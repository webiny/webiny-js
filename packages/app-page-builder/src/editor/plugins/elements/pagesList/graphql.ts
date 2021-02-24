import gql from "graphql-tag";

export const LIST_PUBLISHED_PAGES = gql`
    query ListPublishedPages(
        $where: PbListPublishedPagesWhereInput
        $sort: PbListPagesSortInput
        $limit: Int
        $page: Int
        $exclude: [String]
    ) {
        pageBuilder {
            listPublishedPages(
                where: $where
                sort: $sort
                limit: $limit
                page: $page
                exclude: $exclude
            ) {
                data {
                    id
                    title
                    path
                    url
                    snippet
                    tags
                    images {
                        general {
                            src
                        }
                    }
                    publishedOn
                    createdBy {
                        id
                        displayName
                    }
                    category {
                        slug
                        name
                    }
                }
                meta {
                    from
                    to
                    page
                    nextPage
                    previousPage
                    totalCount
                    totalPages
                }
            }
        }
    }
`;
