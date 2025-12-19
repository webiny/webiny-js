const PAGE_DATA_FIELD = /* GraphQL */ `
    {
        id
        entryId
        version
        title
        path
        status
        locked
        properties
        bindings
        elements
        savedOn
        createdOn
    }
`;

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const CREATE_PAGE = /* GraphQL */ `
    mutation CreatePage($data: WbPageCreateInput!) {
        wb {
            createPage(data: $data) {
                data ${PAGE_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_PAGE = /* GraphQL */ `
    mutation UpdatePage($id: ID!, $data: WbPageUpdateInput!) {
        wb {
            updatePage(id: $id, data: $data) {
                data ${PAGE_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const PUBLISH_PAGE = /* GraphQL */ `
    mutation PublishPage($id: ID!) {
        wb {
            publishPage(id: $id) {
                data ${PAGE_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UNPUBLISH_PAGE = /* GraphQL */ `
    mutation UnpublishPage($id: ID!) {
        wb {
            unpublishPage(id: $id) {
                data ${PAGE_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DUPLICATE_PAGE = /* GraphQL */ `
    mutation DuplicatePage($id: ID!) {
        wb {
            duplicatePage(id: $id) {
                data ${PAGE_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const MOVE_PAGE = /* GraphQL */ `
    mutation MovePage($id: ID!, $folderId: ID!) {
        wb {
            movePage(id: $id, folderId: $folderId) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const CREATE_PAGE_REVISION_FROM = /* GraphQL */ `
    mutation CreatePageRevisionFrom($id: ID!) {
        wb {
            createPageRevisionFrom(id: $id) {
                data ${PAGE_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_PAGE = /* GraphQL */ `
    mutation DeletePage($id: ID!) {
        wb {
            deletePage(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_PAGE_BY_PATH = /* GraphQL */ `
    query GetPageByPath($path: String!) {
        wb {
            getPageByPath(path: $path) {
                data {
                    id
                    properties
                    bindings
                    elements
                }
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_PAGE_BY_ID = /* GraphQL */ `
    query GetPageById($id: ID!) {
        wb {
            getPageById(id: $id) {
                data ${PAGE_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_PAGE_REVISIONS = /* GraphQL */ `
    query GetPageRevisions($entryId: ID!) {
        wb {
            getPageRevisions(entryId: $entryId) {
                data {
                    id
                    entryId
                    version
                    title
                    status
                    locked
                    savedOn
                }
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_PAGES = /* GraphQL */ `
    query ListPages($limit: Int, $after: String, $where: WbPagesListWhereInput) {
        wb {
            listPages(limit: $limit, after: $after, where: $where) {
                data ${PAGE_DATA_FIELD}
                error ${ERROR_FIELD}
                meta {
                    cursor
                    totalCount
                    hasMoreItems
                }
            }
        }
    }
`;

export const GET_SETTINGS = /* GraphQL */ `
    query GetSettings {
        wb {
            getSettings {
                data {
                    previewDomain
                }
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_SETTINGS = /* GraphQL */ `
    mutation UpdateSettings($data: WbSettingsInput!) {
        wb {
            updateSettings(data: $data) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_INTEGRATIONS = /* GraphQL */ `
    query GetIntegrations {
        wb {
            getIntegrations {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_INTEGRATIONS = /* GraphQL */ `
    mutation UpdateIntegrations($data: JSON!) {
        wb {
            updateIntegrations(data: $data) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_PAGE_MODEL = /* GraphQL */ `
    query GetPageModel {
        wb {
            getPageModel {
                data {
                    modelId
                    name
                }
                error ${ERROR_FIELD}
            }
        }
    }
`;
