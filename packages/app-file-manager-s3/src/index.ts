import gql from "graphql-tag";
import { AppFileManagerStorageS3 } from "./types";

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

export default () =>
    ({
        type: "app-file-manager-storage",
        name: "app-file-manager-storage",
        upload: async (file: File, { apolloClient }) => {
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
                console.log(getPreSignedPostPayload); // eslint-disable-line
                return;
            }
            // 2. upload file to S3
            return await new Promise((resolve, reject) => {
                const formData = new window.FormData();
                Object.keys(getPreSignedPostPayload.data.data.fields).forEach(key => {
                    formData.append(key, getPreSignedPostPayload.data.data.fields[key]);
                });

                formData.append("file", file);

                const xhr = new window.XMLHttpRequest(); // eslint-disable-line
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
    } as AppFileManagerStorageS3);
