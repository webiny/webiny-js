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

export const UPLOAD_FILE = /* GraphQL */`
    mutation UploadFile($data: UploadFileInput!) {
        files {
            uploadFile(data: $data) {
                data {
                    data
                    file {
                        src
                        type
                        name
                        size
                        key
                    }
                }
                error {
                    message
                }
            }
        }
    }
`;

export const CREATE_FILE = /* GraphQL */`
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
