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
        meta
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
    mutation CreateFile($data: FileInput!) {
        fileManager {
            createFile(data: $data) {
                error ${ERROR_FIELDS}
                data ${FILE_FIELDS}
            }
        }
    }
`;
