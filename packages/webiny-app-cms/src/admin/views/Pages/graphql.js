import gql from "graphql-tag";

export const loadEditorData = gql`
    query CmsGetEditorData($page: ID!, $revision: ID!) {
        cms {
            page: getPage(id: $page) {
                data {
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
                error {
                    code
                    message
                }
            }
            revision: getRevision(id: $revision) {
                data {
                    id
                    name
                    published
                    locked
                    title
                    slug
                    content
                    settings
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const createPage = gql`
    mutation CreatePage($category: ID!, $title: String!) {
        cms {
            page: createPage(data: { category: $category, title: $title }) {
                data {
                    id
                    activeRevision {
                        id
                    }
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const loadPages = gql`
    query CmsListPages($where: JSON, $sort: JSON, $page: Int, $perPage: Int, $search: SearchInput) {
        cms {
            pages: listPages(where: $where, sort: $sort, page: $page, perPage: $perPage, search: $search) {
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

export const loadRevision = gql`
    query CmsLoadRevision($id: ID!) {
        cms {
            revision: getRevision(id: $id) {
                data {
                    id
                    name
                    title
                    slug
                    content
                    settings
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const loadPageRevisions = gql`
    query CmsLoadPageRevisions($id: ID!) {
        cms {
            revisions: listRevisions(where: { page: $id }, sort: { createdOn: 1 }, perPage: 100) {
                data {
                    id
                    name
                    title
                    savedOn
                    published
                    locked
                }
            }
        }
    }
`;
