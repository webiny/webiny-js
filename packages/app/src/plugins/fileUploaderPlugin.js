// @flow
import type { FileUploaderPlugin } from "@webiny/app/types";
import gql from "graphql-tag";

const UPLOAD_FILE = gql`
    mutation UploadFile($data: UploadFileInput!) {
        files {
            upload(data: $data) {
                data {
                    data
                    file {
                        src
                        type
                        name
                        size
                    }
                }
            }
        }
    }
`;

export default (): FileUploaderPlugin => ({
    type: "file-uploader",
    name: "file-uploader",
    upload: async (file: File, { apolloClient }) => {
        console.log("ideeee");
        const presignedPostPayload = await apolloClient.mutate({
            mutation: UPLOAD_FILE,
            variables: {
                data: { size: file.size, name: file.name, type: file.type }
            }
        });
        console.log("dobeo presigned", presignedPostPayload);

        return await new Promise((resolve, reject) => {
            const formData = new window.FormData();
            Object.keys(presignedPostPayload.data.data.fields).forEach(key => {
                formData.append(key, presignedPostPayload.data.data.fields[key]);
            });

            formData.append("file", file);

            const xhr = new window.XMLHttpRequest(); // eslint-disable-line
            xhr.open("POST", presignedPostPayload.data.data.url, true);
            xhr.send(formData);
            xhr.onload = function() {
                if (this.status === 204) {
                    resolve(presignedPostPayload.data.file);
                    return;
                }

                reject(this.responseText);
            };
        });
    }
});
