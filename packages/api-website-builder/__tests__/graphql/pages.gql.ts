const PAGE_DATA_FIELD = /* GraphQL */ `
    {
        id
        entryId
        status
        version
        locked
        properties
        bindings
        elements
        metadata
        savedOn
        createdOn
        location {
            folderId
        }
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
        websiteBuilder {
            createPage(data: $data) {
                data ${PAGE_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_PAGE = /* GraphQL */ `
    mutation UpdatePage($id: ID!, $data: WbPageUpdateInput!) {
        websiteBuilder {
            updatePage(id: $id, data: $data) {
                data ${PAGE_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const PUBLISH_PAGE = /* GraphQL */ `
    mutation PublishPage($id: ID!) {
        websiteBuilder {
            publishPage(id: $id) {
                data ${PAGE_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UNPUBLISH_PAGE = /* GraphQL */ `
    mutation UnpublishPage($id: ID!) {
        websiteBuilder {
            unpublishPage(id: $id) {
                data ${PAGE_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DUPLICATE_PAGE = /* GraphQL */ `
    mutation DuplicatePage($id: ID!) {
        websiteBuilder {
            duplicatePage(id: $id) {
                data ${PAGE_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const MOVE_PAGE = /* GraphQL */ `
    mutation MovePage($id: ID!, $folderId: ID!) {
        websiteBuilder {
            movePage(id: $id, folderId: $folderId) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const CREATE_PAGE_REVISION_FROM = /* GraphQL */ `
    mutation CreatePageRevisionFrom($id: ID!) {
        websiteBuilder {
            createPageRevisionFrom(id: $id) {
                data ${PAGE_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const TRASH_PAGE = /* GraphQL */ `
    mutation TrashPage($id: ID!) {
        websiteBuilder {
            trashPage: deletePage(id: $id, permanently: false) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_PAGE = /* GraphQL */ `
    mutation DeletePage($id: ID!) {
        websiteBuilder {
            deletePage(id: $id, permanently: true) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const RESTORE_PAGE = /* GraphQL */ `
    mutation RestorePage($id: ID!) {
        websiteBuilder {
            restorePage(id: $id) {
                data ${PAGE_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_PAGE_BY_PATH = /* GraphQL */ `
    query GetPageByPath($path: String!) {
        websiteBuilder {
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
        websiteBuilder {
            getPageById(id: $id) {
                data ${PAGE_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_PAGE_REVISIONS = /* GraphQL */ `
    query GetPageRevisions($entryId: ID!) {
        websiteBuilder {
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
        websiteBuilder {
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

export const LIST_TRASHED_PAGES = /* GraphQL */ `
    query ListTrashedPages {
        websiteBuilder {
            listTrashedPages: listDeletedPages {
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
        websiteBuilder {
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
        websiteBuilder {
            updateSettings(data: $data) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_INTEGRATIONS = /* GraphQL */ `
    query GetIntegrations {
        websiteBuilder {
            getIntegrations {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_INTEGRATIONS = /* GraphQL */ `
    mutation UpdateIntegrations($data: JSON!) {
        websiteBuilder {
            updateIntegrations(data: $data) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_PAGE_MODEL = /* GraphQL */ `
    query GetPageModel {
        websiteBuilder {
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
