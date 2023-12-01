const DATA_FIELD_WITH_ID = (fields: string[] = []) => {
    return /* GraphQL */ `
        {
            id
            key
            name
            size
            type
            tags
            aliases
            ${fields.join("\n")}
        }
    `;
};

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const CREATE_FILE = (fields: string[] = []) => {
    return /* GraphQL */ `
        mutation CreateFile($data: FmFileCreateInput!) {
            fileManager {
                createFile(data: $data) {
                    data ${DATA_FIELD_WITH_ID(fields)}
                    error ${ERROR_FIELD}
                }
            }
        }
    `;
};

export const CREATE_FILES = (fields: string[] = []) => {
    return /* GraphQL */ `
        mutation CreateFiles($data: [FmFileCreateInput!]!) {
            fileManager {
                createFiles(data: $data) {
                    data ${DATA_FIELD_WITH_ID(fields)}
                    error ${ERROR_FIELD}
                }
            }
        }
    `;
};

export const UPDATE_FILE = (fields: string[] = []) => {
    return /* GraphQL */ `
        mutation UpdateFile($id: ID!, $data: FmFileUpdateInput!) {
            fileManager {
                updateFile(id: $id, data: $data) {
                    data ${DATA_FIELD_WITH_ID(fields)}
                    error ${ERROR_FIELD}
                }
            }
        }
    `;
};

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

export const GET_FILE = (fields: string[] = []) => {
    return /* GraphQL */ `
        query GetFile($id: ID!) {
            fileManager {
                getFile(id: $id) {
                    data ${DATA_FIELD_WITH_ID(fields)}
                    error ${ERROR_FIELD}
                }
            }
        }
    `;
};

export const LIST_FILES = (fields: string[]) => {
    return /* GraphQL */ `
        query ListFiles(
            $search: String,
            $limit: Int,
            $after: String,
            $where: FmFileListWhereInput
        ) {
            fileManager {
                listFiles(
                    search: $search,
                    limit: $limit,
                    after: $after,
                    where: $where
                ) {
                    data ${DATA_FIELD_WITH_ID(fields)}
                    meta {
                        cursor
                        totalCount
                        hasMoreItems
                    }
                    error ${ERROR_FIELD}
                }
            }
        }
    `;
};

export const LIST_TAGS = /* GraphQL */ `
    query ListTags($where: FmTagsListWhereInput) {
        fileManager {
            listTags(where: $where) {
                data {
                    tag
                    count
                }
                error ${ERROR_FIELD}
            }
        }
    }
`;
