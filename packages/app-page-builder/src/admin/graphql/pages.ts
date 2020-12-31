import gql from "graphql-tag";

const error = `
error {
    code
    message
}`;

export const DATA_FIELDS = `
    id
    pid
    title
    path
    version
    locked
    status
    revisions {
        id
        savedOn
        locked
        title
        status
        version
    }
    
`;

export const CREATE_PAGE = gql`
    mutation CreatePage($from: ID, $category: String) {
        pageBuilder {
            createPage(from: $from, category: $category) {
                data {
                    id
                }
                ${error}
            }
        }
    }
`;

export const LIST_PAGES = gql`
    query ListPages(
        $where: PbListPagesWhereInput
        $sort: PbListPagesSortInput
        $search: PbListPagesSearchInput
        $limit: Int
        $page: Int
    ) {
        pageBuilder {
            listPages(where: $where, sort: $sort, limit: $limit, page: $page, search: $search) {
                data {
                    id
                    pid
                    status
                    title
                    version
                    savedOn
                    category {
                        name
                        slug
                    }
                    createdBy {
                        id
                        displayName
                    }
                }
                meta {
                    page
                    limit
                    totalCount
                    totalPages
                    from
                    to
                    nextPage
                    previousPage
                }
                error {
                    data
                    code
                    message
                }
            }
        }
    }
`;

export const GET_PAGE = gql`
    query GetPage($id: ID!) {
        pageBuilder {
            getPage(id: $id) {
                data {
                    ${DATA_FIELDS}
                    createdBy {
                        id
                    }
                    content

                }
                ${error}
            }
        }
    }
`;

export const PUBLISH_PAGE = gql`
    mutation PublishPage($id: ID!) {
        pageBuilder {
            publishPage(id: $id) {
                data {
                    ${DATA_FIELDS}
                }
                ${error}
            }
        }
    }
`;

export const DELETE_PAGE = gql`
    mutation PbDeletePage($id: ID!) {
        pageBuilder {
            deletePage(id: $id) {
                data {
                    latestPage {
                        id
                        status
                        version
                    }
                }
                ${error}
            }
        }
    }
`;

const elementFields = /*GraphQL*/ `
    id
    name
    type
    category
    content
    preview
`;

export const LIST_ELEMENTS = gql`
    query PbListElements {
        pageBuilder {
            elements: listPageElements {
                data {
                    ${elementFields}
                }
            }
        }
    }
`;

export const CREATE_ELEMENT = gql`
    mutation PbCreateElement($data: PbElementInput!) {
        pageBuilder {
            element: createElement(data: $data) {
                data {
                    ${elementFields}
                }
                ${error}
            }
        }
    }
`;

export const UPDATE_ELEMENT = gql`
    mutation PbUpdateElement($id: ID!, $data: PbUpdateElementInput!) {
        pageBuilder {
            element: updateElement(id: $id, data: $data) {
                data {
                    ${elementFields}
                }
                ${error}
            }
        }
    }
`;
