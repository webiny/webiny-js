export const UPLOAD_FILES = /* GraphQL */ `
    mutation UploadFiles($data: [UploadFileInput]!) {
        files {
            uploadFiles(data: $data) {
                data
                error {
                    message
                }
            }
        }
    }
`;

export const CREATE_FILES = /* GraphQL */ `
    mutation CreateFile($data: [FileInput]!) {
        files {
            createFiles(data: $data) {
                error {
                    message
                }
            }
        }
    }
`;
