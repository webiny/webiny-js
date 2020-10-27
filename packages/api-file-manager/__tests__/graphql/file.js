const DATA_FIELD = /* GraphQL */ `
    {
        id
        key
        name
        size
        type
        tags
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
    mutation CreateFile($data: FileInput!) {
        files {
            createFile(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const CREATE_FILES = /* GraphQL */ `
    mutation CreateFile($data: [FileInput]!) {
        files {
            createFiles(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_FILE = /* GraphQL */ `
    mutation UpdateFile($id: ID!, $data: FileInput!) {
        files {
            updateFile(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_FILE = /* GraphQL */ `
    mutation DeleteFile($id: ID!) {
        files {
            deleteFile(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_FILE = /* GraphQL */ `
    query GetFile($id: ID!, $where: JSON, $sort: String) {
        files {
            getFile(id: $id, where: $where, sort: $sort) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_FILES = /* GraphQL */ `
    query ListFiles(
        $limit: Int,
        $after: String,
        $before: String,
        $types: [String],
        $tags: [String],
        $ids: [ID],
        $search: String,
    ) {
        files {
            listFiles(
                limit: $limit,
                after: $after,
                before: $before,
                types: $types,
                tags: $tags,
                ids: $ids,
                search: $search
            ) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const IS_INSTALLED = /* GraphQL */ `
    query IsInstalled {
        files {
            isInstalled {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const INSTALL = /* GraphQL */ `
    mutation install($srcPrefix: String) {
        files {
            install(srcPrefix: $srcPrefix) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_SETTINGS = /* GraphQL */ `
    query GetSettings {
        files {
            getSettings {
                data {
                    uploadMinFileSize
                    uploadMaxFileSize
                }
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_SETTINGS = /* GraphQL */ `
    mutation UpdateSettings($data: FileManagerSettingsInput) {
        files {
            updateSettings(data: $data) {
                data {
                    uploadMinFileSize
                    uploadMaxFileSize
                }
                error ${ERROR_FIELD}
            }
        }
    }
`;
