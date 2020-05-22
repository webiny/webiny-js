import gql from "graphql-tag";

export const loadPages = gql`
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
