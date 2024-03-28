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
        canManageStructure
        canManageContent
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
