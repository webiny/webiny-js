const DATA_FIELD = (fields: string[] = []) => {
    return /* GraphQL */ `
        {
            key
            name
            size
            type
            tags
            ${fields.join("\n")}
        }
    `;
};

const DATA_FIELD_WITH_ID = (fields: string[] = []) => {
    return /* GraphQL */ `
        {
            id
            key
            name
            size
            type
            tags
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
        mutation CreateFile($data: FileInput!) {
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
        mutation CreateFiles($data: [FileInput]!) {
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
        mutation UpdateFile($id: ID!, $data: FileInput!) {
            fileManager {
                updateFile(id: $id, data: $data) {
                    data ${DATA_FIELD(fields)}
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
        query GetFile($id: ID!, $where: JSON, $sort: String) {
            fileManager {
                getFile(id: $id, where: $where, sort: $sort) {
                    data ${DATA_FIELD(fields)}
                    error ${ERROR_FIELD}
                }
            }
        }
    `;
};

export const LIST_FILES = (fields: string[]) => {
    return /* GraphQL */ `
        query ListFiles(
            $limit: Int,
            $after: String,
            $types: [String],
            $tags: [String],
            $ids: [ID],
            $search: String,
            $where: FileWhereInput
        ) {
            fileManager {
                listFiles(
                    limit: $limit,
                    after: $after,
                    types: $types,
                    tags: $tags,
                    ids: $ids,
                    search: $search,
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
    query ListTags($where: TagWhereInput) {
        fileManager {
            listTags(where: $where)
        }
    }
`;
