export const DATA_FIELD = /* GraphQL */ `
    {
        id
        category
        preview
        name
        content
        type
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

export const CREATE_PAGE_ELEMENT = /* GraphQL */ `
    mutation CreatePageElement($data: PbPageElementInput!) {
        pageBuilder {
            createPageElement(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_PAGE_ELEMENT = /* GraphQL */ `
    mutation UpdatePageElement($id: ID!, $data: PbPageElementInput!) {
        pageBuilder {
            updatePageElement(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_PAGE_ELEMENTS = /* GraphQL */ `
    query ListPageElements {
        pageBuilder {
            listPageElements {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_PAGE_ELEMENT = /* GraphQL */ `
    query GetPageElement($id: ID!) {
        pageBuilder {
            getPageElement(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_PAGE_ELEMENT = /* GraphQL */ `
    mutation DeletePageElement($id: ID!) {
        pageBuilder {
            deletePageElement(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
