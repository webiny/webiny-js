import gql from "graphql-tag";

export const loadEditorData = gql`
    query GetEditorData($page: ID!, $revision: ID!) {
        Cms {
            page: getPage(id: $page) {
                id
                status
                category {
                    id
                    name
                    url
                }
                revisions {
                    id
                    name
                    published
                    locked
                }
            }
            revision: getRevision(id: $revision) {
                id
                name
                published
                locked
                title
                slug
                content
                settings
            }
        }
    }
`;

export const createPage = gql`
    mutation CreatePage($category: ID!, $title: String) {
        Cms {
            createPage(data: { category: $category, title: $title }) {
                id
                activeRevision {
                    id
                }
            }
        }
    }
`;

export const loadPages = gql`
    query ListPages($where: JSON, $sort: JSON, $page: Int, $perPage: Int, $search: SearchInput) {
        Cms {
            listPages(where: $where, sort: $sort, page: $page, perPage: $perPage, search: $search) {
                data {
                    id
                    activeRevision {
                        id
                        title
                        slug
                    }
                }
                meta {
                    count
                    totalCount
                    from
                    to
                    page
                    totalPages
                    perPage
                    nextPage
                    previousPage
                }
            }
        }
    }
`;
