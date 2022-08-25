export const DATA_FIELD = /* GraphQL */ `
    {
        slug
        name
        icon
        description
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

export const CREATE_BLOCK_CATEGORY = /* GraphQL */ `
    mutation CreateBlockCategory($data: PbBlockCategoryInput!) {
        pageBuilder {
            createBlockCategory(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_BLOCK_CATEGORY = /* GraphQL */ `
    mutation UpdateBlockCategory($slug: String!, $data: PbBlockCategoryInput!) {
        pageBuilder {
            updateBlockCategory(slug: $slug, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_BLOCK_CATEGORIES = /* GraphQL */ `
    query ListBlockCategories {
        pageBuilder {
            listBlockCategories {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_BLOCK_CATEGORY = /* GraphQL */ `
    query GetBlockCategory($slug: String!) {
        pageBuilder {
            getBlockCategory(slug: $slug) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_BLOCK_CATEGORY = /* GraphQL */ `
    mutation DeleteBlockCategory($slug: String!) {
        pageBuilder {
            deleteBlockCategory(slug: $slug) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
