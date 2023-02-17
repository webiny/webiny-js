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
