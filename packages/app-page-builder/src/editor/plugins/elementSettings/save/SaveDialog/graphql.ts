import gql from "graphql-tag";

const FILE_FIELDS = /* GraphQL */ `
    {
        __typename
        id
        name
        key
        src
        size
        type
        tags
        createdOn
        meta {
            private
            width
            height
        }
    }
`;

const ERROR_FIELDS = /* GraphQL */ `
    {
        code
        message
        data
    }
`;

export const CREATE_FILE = gql`
    mutation CreateFile($data: FmFileCreateInput!) {
        fileManager {
            createFile(data: $data) {
                error ${ERROR_FIELDS}
                data ${FILE_FIELDS}
            }
        }
    }
`;
// TODO: for Webiny core team: export these queries from the app-file-manager package, to make them reusable
export const DELETE_FILE = gql`
    mutation deleteFile($id: ID!) {
        fileManager {
            deleteFile(id: $id) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;
