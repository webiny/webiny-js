export const DATA_FIELD = /* GraphQL */ `
    {
        slug
        url
        name
        layout
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

export const UPDATE_CATEGORY = /* GraphQL */ `
    mutation UpdateCategory($slug: String!, $data: PbCategoryInput!) {
        pageBuilder {
            updateCategory(slug: $slug, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_CATEGORIES = /* GraphQL */ `
    query ListCategories {
        pageBuilder {
            listCategories {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
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

export const DELETE_CATEGORY = /* GraphQL */ `
    mutation DeleteCategory($slug: String!) {
        pageBuilder {
            deleteCategory(slug: $slug) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
