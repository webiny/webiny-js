// @flow
import gql from "graphql-tag";
import get from "lodash.get";

const UPLOAD_FILE = gql`
    mutation UploadFile($data: UploadFileInput!) {
        files {
            uploadFile(data: $data) {
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

export default () => ({
    type: "file-uploader",
    name: "file-uploader",
    upload: async (file: File, { apolloClient }) => {
        let presignedPostPayload = await apolloClient.mutate({
            mutation: UPLOAD_FILE,
            variables: {
                data: { size: file.size, name: file.name, type: file.type }
            }
        });

        presignedPostPayload = get(presignedPostPayload, "data.files.uploadFile");
        if (presignedPostPayload.error) {
            console.log(presignedPostPayload.error.message); // eslint-disable-line
            return;
        }

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
