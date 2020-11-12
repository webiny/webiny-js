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
    parent
    published
    locked
    
`;

export const LIST_DATA_FIELDS = `
    status
    title
    category
    createdBy {
        displayName
    }
`

export const CREATE_PAGE = gql`
    mutation PbCreatePage($category: String!) {
        pageBuilder {
            page: createPage(data: { category: $category }) {
                data {
                    id
                }
                ${error}
            }
        }
    }
`;

export const LIST_PAGES = gql`
    query PbListPages($sort: JSON, $limit: Int) {
        pageBuilder {
            listPages(sort: $sort, limit: $limit) {
                data {
                    id
                    title
                    ${LIST_DATA_FIELDS}
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
 category {
                        id
                        name
                        url
                    }
 revisions {
                        ${sharedFields}
                    }
 *
 * */
export const GET_PAGE = gql`
    query PbGetPage($id: ID!) {
        pageBuilder {
            page: getPage(id: $id) {
                data {
                    ${DATA_FIELDS}
                    snippet
                    category
                    content

                }
                ${error}
            }
        }
    }
`;

export const CREATE_REVISION_FORM = gql`
    mutation PbCreateRevisionFrom($revision: ID!) {
        pageBuilder {
            revision: createRevisionFrom(revision: $revision) {
                data {
                    id
                }
                ${error}
            }
        }
    }
`;

export const PUBLISH_REVISION = gql`
    mutation PbPublishRevision($id: ID!) {
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
