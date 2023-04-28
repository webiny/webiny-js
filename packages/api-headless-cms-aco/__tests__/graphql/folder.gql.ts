const DATA_FIELD = /* GraphQL */ `
    {
        id
        title
        slug
        type
        parentId
    }
`;

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const CREATE_FOLDER = /* GraphQL */ `
    mutation CreateFolder($data: FolderCreateInput!) {
        aco {
            createFolder(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
