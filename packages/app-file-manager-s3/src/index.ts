import gql from "graphql-tag";
import { FileUploaderPlugin, UploadOptions } from "@webiny/app/types";

const GET_PRE_SIGNED_POST_PAYLOAD = gql`
    query getPreSignedPostPayload($data: PreSignedPostPayloadInput!) {
        fileManager {
            getPreSignedPostPayload(data: $data) {
                data {
                    data
                    file {
                        id
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

export default (): FileUploaderPlugin => {
    class S3FileUploader implements FileUploaderPlugin {
        public readonly type = "file-uploader";
        public readonly name = "file-uploader";

        async upload(file: File, { apolloClient, onProgress }: UploadOptions) {
            // 1. GET PreSignedPostPayload
            const response = await apolloClient.query({
                query: GET_PRE_SIGNED_POST_PAYLOAD,
                fetchPolicy: "no-cache",
                variables: {
                    data: { size: file.size, name: file.name, type: file.type }
                }
            });

            const { getPreSignedPostPayload } = response.data.fileManager;
            if (getPreSignedPostPayload.error) {
                console.error(getPreSignedPostPayload);
                return;
            }

            // 2. upload file to S3
            return new Promise((resolve, reject) => {
                const formData = new window.FormData();
                Object.keys(getPreSignedPostPayload.data.data.fields).forEach(key => {
                    formData.append(key, getPreSignedPostPayload.data.data.fields[key]);
                });

                formData.append("file", file);

                const xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener(
                    "progress",
                    event => {
                        if (onProgress) {
                            onProgress(event);
                        }
                    },
                    false
                );
                xhr.open("POST", getPreSignedPostPayload.data.data.url, true);
                xhr.send(formData);
                xhr.onload = function () {
                    if (this.status === 204) {
                        resolve(getPreSignedPostPayload.data.file);
                        return;
                    }

                    reject(this.responseText);
                };
            });
        }
    }

    return new S3FileUploader();
};
