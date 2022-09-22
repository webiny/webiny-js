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
    }
`;

export const CREATE_FOLDER = gql`
    mutation CreateFolder($name: String!, $slug: String!, $type: String!, $parentId: ID) {
        folders {
            createFolder(data: { name: $name, slug: $slug, type: $type, parentId: $parentId }) {
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

export const UPDATE_FOLDER = gql`
    mutation UpdateFolder($id: ID!, $name: String, $slug: String, $parentId: ID) {
        folders {
            updateFolder(id: $id, data: { parentId: $parentId, name: $name, slug: $slug }) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
