import gql from "graphql-tag";
import { AppFileManagerStorageS3 } from "./types";

const GET_PRE_SIGNED_POST_PAYLOAD = gql`
    query getPreSignedPostPayload($data: PreSignedPostPayloadInput!) {
        files {
            getPreSignedPostPayload(data: $data) {
                data {
                    data
                    file {
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

export default () =>
    ({
        type: "app-file-manager-storage",
        name: "app-file-manager-storage-s3",
        upload: async (file: File, { apolloClient }) => {
            // 1. GET PreSignedPostPayload
            const response = await apolloClient.query({
                query: GET_PRE_SIGNED_POST_PAYLOAD,
                variables: {
                    data: { size: file.size, name: file.name, type: file.type }
                }
            });

            const preSignedPostPayload = response?.data?.files?.getPreSignedPostPayload;
            if (preSignedPostPayload?.error) {
                console.log(preSignedPostPayload.error.message); // eslint-disable-line
                return;
            }
            // 2. upload file to S3
            return await new Promise((resolve, reject) => {
                const formData = new window.FormData();
                Object.keys(preSignedPostPayload.data.data.fields).forEach(key => {
                    formData.append(key, preSignedPostPayload.data.data.fields[key]);
                });

                formData.append("file", file);

                const xhr = new window.XMLHttpRequest(); // eslint-disable-line
                xhr.open("POST", preSignedPostPayload.data.data.url, true);
                xhr.send(formData);
                xhr.onload = function() {
                    if (this.status === 204) {
                        resolve(preSignedPostPayload.data.file);
                        return;
                    }

                    reject(this.responseText);
                };
            });
        }
    } as AppFileManagerStorageS3);
