export const UPLOAD_FILE = /* GraphQL */ `
    mutation UploadFiles($data: UploadFileInput!) {
        files {
            uploadFile(data: $data) {
                data {
                    file {
                        key
                        name
                        type
                        size
                    }
                    data
                }
                error {
                    message
                }
            }
        }
    }
`;

export const CREATE_FILE = /* GraphQL */ `
    mutation CreateFile($data: FileInput!) {
        files {
            createFile(data: $data) {
                error {
                    message
                }
                data {
                    src
                    id
                }
            }
        }
    }
`;
