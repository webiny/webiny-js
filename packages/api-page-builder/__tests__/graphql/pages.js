export const DATA_FIELD = /* GraphQL */ `
    {
        id
        publishedOn
        category
        version
        title
        url
        fullUrl
        # settings
        content
        snippet
        published
        locked
        parent
        createdOn
        createdBy {
            id
            displayName
        }
    }
`;

const LIST_DATA_FIELD = /* GraphQL */ `
    {
        id
        category
        status
        published
        title
        url
        status
        createdOn
        createdBy {
            id
            displayName
        }
    }
`;

export const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const CREATE_PAGE = /* GraphQL */ `
    mutation CreatePage($data: PbCreatePageInput!) {
        pageBuilder {
            createPage(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_PAGE = /* GraphQL */ `
    mutation UpdatePage($id: ID!, $data: PbUpdatePageInput!) {
        pageBuilder {
            updatePage(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_PAGES = /* GraphQL */ `
    query ListPages {
        pageBuilder {
            listPages {
                data ${LIST_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_PAGE = /* GraphQL */ `
    query GetPage($id: ID!) {
        pageBuilder {
            getPage(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_PAGE = /* GraphQL */ `
    mutation DeletePage($id: ID!) {
        pageBuilder {
            deletePage(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
