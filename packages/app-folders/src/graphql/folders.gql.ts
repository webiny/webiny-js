import gql from "graphql-tag";

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

const DATA_FIELD = /* GraphQL */ `
    {
        id
        name
        slug
        parentId
        type
    }
`;

export const CREATE_FOLDER = gql`
    mutation CreateFolder($data: FolderCreateInput!) {
        folders {
            createFolder(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_FOLDERS = gql`
    query ListFolders ($type: String!) {
        folders {
            listFolders(where: { type: $type }) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_FOLDER = gql`
    query GetFolder ($id: ID!) {
        folders {
            getFolder(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_FOLDER = gql`
    mutation UpdateFolder($id: ID!, $data: FolderUpdateInput!) {
        folders {
            updateFolder(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_FOLDER = gql`
    mutation DeleteFolder($id: ID!) {
        folders {
            deleteFolder(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;
