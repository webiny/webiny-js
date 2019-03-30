// @flow
/* global window */

import type { WithFileUploadPlugin } from "webiny-app/types";
import dataURLtoBlob from "dataurl-to-blob";

// Note that file.src is always a base64 encoded dataURL.
type SelectedFile = Object & {
    src: string,
    name: string,
    type: string
};

type WithFileUploadUploaderConfigType = { uri?: string };
type WithFileUploadUploaderType = WithFileUploadUploaderConfigType => WithFileUploadPlugin;

const fileUploadPlugin: WithFileUploadUploaderType = (config = {}) => ({
    type: "with-file-upload-uploader",
    name: "with-file-upload-uploader",
    upload: async (file: SelectedFile) => {
        const uri = config.uri || "/files";

        const presignedPostPayload = await new Promise(resolve => {
            const xhr = new window.XMLHttpRequest();
            xhr.open("POST", uri, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify({ name: file.name, type: file.type }));
            xhr.onload = function() {
                resolve(JSON.parse(this.responseText));
            };
        });

        return await new Promise((resolve, reject) => {
            const formData = new window.FormData();
            Object.keys(presignedPostPayload.data.s3.fields).forEach(key => {
                formData.append(key, presignedPostPayload.data.s3.fields[key]);
            });

            formData.append("file", dataURLtoBlob(file.src));

            const xhr = new window.XMLHttpRequest(); // eslint-disable-line
            xhr.open("POST", presignedPostPayload.data.s3.url, true);
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

export default fileUploadPlugin;
