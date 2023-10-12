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
        title
        slug
        parentId
        type
        savedOn
        createdOn
        createdBy {
            id
            displayName
        }
    }
`;

export const CREATE_FOLDER = gql`
    mutation CreateFolder($data: FolderCreateInput!) {
        aco {
            createFolder(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_FOLDERS = gql`
    query ListFolders ($type: String!) {
        aco {
            listFolders(where: { type: $type }) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_FOLDER = gql`
    query GetFolder ($id: ID!) {
        aco {
            getFolder(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_FOLDER = gql`
    mutation UpdateFolder($id: ID!, $data: FolderUpdateInput!) {
        aco {
            updateFolder(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_FOLDER = gql`
    mutation DeleteFolder($id: ID!) {
        aco {
            deleteFolder(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;
