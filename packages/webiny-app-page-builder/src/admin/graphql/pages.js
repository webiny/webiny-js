// @flow
import gql from "graphql-tag";
import { getPlugins } from "webiny-plugins";
import type { PbPageSettingsPluginType } from "webiny-app-page-builder/types";

const error = `
error {
    code
    message
}`;

const sharedFields = `
    id
    title
    url
    version
    parent
    published
    isHomePage
    isErrorPage
    isNotFoundPage
    locked
    savedOn
`;

export const createPage = gql`
    mutation PbCreatePage($category: ID!) {
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

export const listPages = gql`
    query PbListPages($sort: JSON, $page: Int, $perPage: Int, $search: String) {
        pageBuilder {
            pages: listPages(sort: $sort, page: $page, perPage: $perPage, search: $search) {
                data {
                    ${sharedFields}
                    category {
                        id
                        name
                    }
                    createdBy {
                        firstName
                        lastName
                    }
                }
                meta {
                    totalCount
                    to
                    from
                    nextPage
                    previousPage
                }
            }
        }
    }
`;

export const getPage = () => gql`
    query PbGetPage($id: ID!) {
        pageBuilder {
            page: getPage(id: $id) {
                data {
                    ${sharedFields}
                    snippet
                    content
                    settings {
                        _empty
                        ${getPlugins("pb-editor-page-settings")
                            .map((pl: PbPageSettingsPluginType) => pl.fields)
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
                }
                ${error}
            }
        }
    }
`;

export const createRevisionFrom = gql`
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

export const publishRevision = gql`
    mutation PbPublishRevision($id: ID!) {
        pageBuilder {
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
    mutation PbDeleteRevision($id: ID!) {
        pageBuilder {
            deleteRevision(id: $id) {
                data
                ${error}
            }
        }
    }
`;

export const deletePage = gql`
    mutation DeletePage($id: ID!) {
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

export const listElements = gql`
    query PbListElements {
        pageBuilder {
            elements: listElements(perPage: 1000) {
                data {
                    ${elementFields}
                }
            }
        }
    }
`;

export const createElement = gql`
    mutation PbCreateElement($data: ElementInput!) {
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

export const updateElement = gql`
    mutation PbUpdateElement($id: ID!, $data: UpdateElementInput!) {
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
