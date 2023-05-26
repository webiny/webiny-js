const DATA_FIELD = /* GraphQL */ `
    {
        id
        key
        name
        size
        type
        tags
        aliases
        meta
        createdOn
        createdBy {
            id
            displayName
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

export const CREATE_FILE = /* GraphQL */ `
    mutation CreateFile($data: CreateFileInput!) {
        fileManager {
            createFile(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const CREATE_FILES = /* GraphQL */ `
    mutation CreateFiles($data: [CreateFileInput]!) {
        fileManager {
            createFiles(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_FILE = /* GraphQL */ `
    mutation UpdateFile($id: ID!, $data: UpdateFileInput!) {
        fileManager {
            updateFile(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_FILE = /* GraphQL */ `
    mutation DeleteFile($id: ID!) {
        fileManager {
            deleteFile(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;
