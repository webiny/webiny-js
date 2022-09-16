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

export const LIST_FOLDERS = gql`
    query ListFolders {
        folders {
            listFolders(where: { type: "page" }) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_FOLDER = gql`
    mutation UpdateFolder($id: String!, $parentId: String!) {
        folders {
            updateFolder(id: $id, data: { parentId: $parentId }) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
