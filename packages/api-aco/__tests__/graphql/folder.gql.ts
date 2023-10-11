const DATA_FIELD = /* GraphQL */ `
    {
        id
        title
        slug
        type
        parentId
        permissions {
            target
            level
            inheritedFrom
        }
        hasNonInheritedPermissions
        canManagePermissions
        createdBy {
            id
            displayName
            type
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

export const UPDATE_FOLDER = /* GraphQL */ `
    mutation UpdateFolder($id: ID!, $data: FolderUpdateInput!) {
        aco {
            updateFolder(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_FOLDER = /* GraphQL */ `
    mutation DeleteFolder($id: ID!) {
        aco {
            deleteFolder(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_FOLDERS = /* GraphQL */ `
    query ListFolders($limit: Int,  $after: String, $where: FoldersListWhereInput!) {
        aco {
            listFolders( limit: $limit, after: $after, where: $where) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
                meta {
                    cursor
                    totalCount
                    hasMoreItems
                }

            }
        }
    }
`;

export const GET_FOLDER = /* GraphQL */ `
    query GetFolder($id: ID!) {
        aco {
            getFolder(id: $id ) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
