import gql from "graphql-tag";

export const LIST_PUBLISHED_PAGES = gql`
    query ListPublishedPages(
        $where: PbListPublishedPagesWhereInput
        $limit: Int
        $sort: [PbListPagesSort!]
        $after: String
        $exclude: [String]
    ) @ps(cache: true) {
        pageBuilder {
            listPublishedPages(
                where: $where
                sort: $sort
                limit: $limit
                exclude: $exclude
                after: $after
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
                    totalCount
                    cursor
                    hasMoreItems
                }
            }
        }
    }
`;
