const DATA_FIELD = (fields: string[] = []) => {
    return /* GraphQL */ `
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

export const CREATE_FOLDER = (fields: string[] = []) => {
    return /* GraphQL */ `
        mutation CreateFolder($data: FolderCreateInput!) {
            aco {
                createFolder(data: $data) {
                     data ${DATA_FIELD(fields)}
                    error ${ERROR_FIELD}
                }
            }
        }
    `;
};

export const UPDATE_FOLDER = (fields: string[] = []) => {
    return /* GraphQL */ `
        mutation UpdateFolder($id: ID!, $data: FolderUpdateInput!) {
            aco {
                updateFolder(id: $id, data: $data) {
                    data ${DATA_FIELD(fields)}
                    error ${ERROR_FIELD}
                }
            }
        }
    `;
};

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

export const GET_FOLDER = (fields: string[] = []) => {
    return /* GraphQL */ `
        query GetFolder($id: ID!) {
            aco {
                getFolder(id: $id ) {
                    data ${DATA_FIELD(fields)}
                    error ${ERROR_FIELD}
                }
            }
        }
    `;
};
