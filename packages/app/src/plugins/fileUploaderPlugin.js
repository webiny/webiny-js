// @flow
/* global window */

import type { FileUploaderPlugin } from "@webiny/app/types";

export default (config: Object = {}): FileUploaderPlugin => ({
    type: "file-uploader",
    name: "file-uploader",
    upload: async (file: File) => {
        const uri = config.uri || "/files";

        const presignedPostPayload = await new Promise(resolve => {
            const xhr = new window.XMLHttpRequest();
            xhr.open("POST", uri, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify({ size: file.size, name: file.name, type: file.type }));
            xhr.onload = function() {
                resolve(JSON.parse(this.responseText));
            };
        });

        return await new Promise((resolve, reject) => {
            const formData = new window.FormData();
            Object.keys(presignedPostPayload.data.s3.fields).forEach(key => {
                formData.append(key, presignedPostPayload.data.s3.fields[key]);
            });

            formData.append("file", file);

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
