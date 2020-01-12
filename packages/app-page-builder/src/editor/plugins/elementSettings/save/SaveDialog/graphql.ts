import gql from "graphql-tag";

const fileFields = /* GraphQL */ `
    {
        __typename
        id
        name
        src
        size
        type
        tags
        createdOn
    }
`;

export const CREATE_FILE = gql`
    mutation CreateFile($data: FileInput!) {
        files {
            createFile(data: $data) {
                error {
                    message
                }
                data ${fileFields}
            }
        }
    }
`;
