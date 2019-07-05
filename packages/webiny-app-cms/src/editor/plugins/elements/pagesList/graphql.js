// @flow
import gql from "graphql-tag";
/*, $sortBy: String, $sortDirection: String*/
export const loadPages = gql`
    query ListPublishedPages(
        $category: String
        $sort: PageSortInput
        $tags: [String]
        $tagsRule: TagsRule
        $page: Int
        $perPage: Int
    ) {
        cms {
            pageBuilder {
                listPublishedPages(
                    category: $category
                    sort: $sort
                    tags: $tags
                    tagsRule: $tagsRule
                    page: $page
                    perPage: $perPage
                ) {
                    data {
                        id
                        title
                        url
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
                        from
                        to
                        nextPage
                        previousPage
                        page
                        perPage
                        totalCount
                        totalPages
                    }
                }
            }
        }
    }
`;
