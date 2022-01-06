export const DATA_FIELD = /* GraphQL */ `
    {
        slug
        url
        name
        layout
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

export const GET_CATEGORY = /* GraphQL */ `
    query GetCategory($slug: String!) {
        pageBuilder {
            getCategory(slug: $slug) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const CREATE_CATEGORY = /* GraphQL */ `
    mutation CreateCategory($data: PbCategoryInput!) {
        pageBuilder {
            createCategory(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
