import gql from "graphql-tag";

const error = `
error {
    code
    message
}`;

const sharedFields = `
    id
    title
    slug
    version
    parent
    published
    locked
    savedOn
`;

export const createPage = gql`
    mutation CmsCreatePage($category: ID!) {
        cms {
            page: createPage(data: { category: $category }) {
                data {
                    id
                }
                ${error}
            }
        }
    }
`;

export const listPages = gql`
    query CmsListPages($sort: JSON, $page: Int, $perPage: Int, $search: String) {
        cms {
            pages: listPages(sort: $sort, page: $page, perPage: $perPage, search: $search) {
                data {
                    ${sharedFields}
                    category {
                        name
                    }
                    createdBy {
                        firstName
                        lastName
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

export const getPage = gql`
    query CmsGetPage($id: ID!) {
        cms {
            page: getPage(id: $id) {
                data {
                    ${sharedFields}
                    content
                    settings
                    revisions {
                        ${sharedFields}
                    }
                }
                ${error}
            }
        }
    }
`;

export const createRevisionFrom = gql`
    mutation CmsCreateRevisionFrom($revision: ID!) {
        cms {
            revision: createRevisionFrom(revision: $revision) {
                data {
                    id
                }
                ${error}
            }
        }
    }
`;

export const publishRevision = gql`
    mutation CmsPublishRevision($id: ID!) {
        cms {
            publishRevision(id: $id) {
                data {
                    ${sharedFields}
                }
                ${error}
            }
        }
    }
`;

export const deleteRevision = gql`
    mutation CmsDeleteRevision($id: ID!) {
        cms {
            deleteRevision(id: $id) {
                data
                ${error}
            }
        }
    }
`;

export const deletePage = gql`
    mutation DeletePage($id: ID!) {
        cms {
            deletePage(id: $id) {
                data
                ${error}
            }
        }
    }
`;

const elementFields = `
id
name
type
content
keywords
`;

export const listElements = gql`
    query CmsListElements {
        cms {
            elements: listElements {
                data {
                    ${elementFields}
                }
            }
        }
    }
`;

export const createElement = gql`
    mutation CmsCreateElement($data: ElementInput!) {
        cms {
            element: createElement(data: $data) {
                data {
                    ${elementFields}
                }
                ${error}
            }
        }
    }
`;
