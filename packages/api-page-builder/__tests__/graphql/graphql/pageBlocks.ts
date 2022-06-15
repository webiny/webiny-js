export const DATA_FIELD = /* GraphQL */ `
    {
        id
        blockCategory
        preview
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

export const LIST_PAGE_BLOCKS = /* GraphQL */ `
    query ListPageBlocks {
        pageBuilder {
            listPageBlocks {
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
