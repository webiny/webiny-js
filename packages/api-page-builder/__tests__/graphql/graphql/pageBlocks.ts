export const DATA_FIELD = /* GraphQL */ `
    {
        id
        blockCategory
        name
        content
        createdOn
        createdBy {
            id
            displayName
            type
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

export const CREATE_PAGE_BLOCK = /* GraphQL */ `
    mutation CreatePageBlock($data: PbCreatePageBlockInput!) {
        pageBuilder {
            createPageBlock(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_PAGE_BLOCK = /* GraphQL */ `
    mutation UpdatePageBlock($id: ID!, $data: PbUpdatePageBlockInput!) {
        pageBuilder {
            updatePageBlock(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_PAGE_BLOCKS = /* GraphQL */ `
    query ListPageBlocks($where: PbListPageBlocksWhereInput) {
        pageBuilder {
            listPageBlocks(where: $where) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_PAGE_BLOCK = /* GraphQL */ `
    query GetPageBlock($id: ID!) {
        pageBuilder {
            getPageBlock(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_PAGE_BLOCK = /* GraphQL */ `
    mutation DeletePageBlock($id: ID!) {
        pageBuilder {
            deletePageBlock(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;
