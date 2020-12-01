import gql from "graphql-tag";

const error = `
error {
    code
    message
}`;

/**
 isHomePage
 isErrorPage
 isNotFoundPage
 savedOn
 * */
export const DATA_FIELDS = `
    id
    title
    url
    version
    locked
    status
    revisions {
        id
        savedOn
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
    query ListPages($where: PbListPagesWhereInput, $sort: PbListPagesSortInput, $limit: Int) {
        pageBuilder {
            listPages(where: $where, sort: $sort, limit: $limit) {
                data {
                    id
                    status
                    title
                    version
                    savedOn
                    category {
                        name
                        slug
                    }
                    createdBy {
                        displayName
                    }
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

/**
 *
 settings {
                        _empty
                        ${getPlugins("pb-editor-page-settings")
                            .map((pl: PbEditorPageSettingsPlugin) => pl.fields)
                            .join("\n")}
                    }
 revisions {
                        ${sharedFields}
                    }
 *
 * */
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
    mutation PublishRevision($id: ID!) {
        pageBuilder {
            publishRevision(id: $id) {
                data {
                    ${DATA_FIELDS}
                }
                ${error}
            }
        }
    }
`;

export const DELETE_REVISION = gql`
    mutation PbDeleteRevision($id: ID!) {
        pageBuilder {
            deleteRevision(id: $id) {
                data
                ${error}
            }
        }
    }
`;

export const DELETE_PAGE = gql`
    mutation PbDeletePage($id: ID!) {
        pageBuilder {
            deletePage(id: $id) {
                data
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
    preview {
        src
        meta
    }
`;

export const LIST_ELEMENTS = gql`
    query PbListElements {
        pageBuilder {
            elements: listElements(limit: 1000) {
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
