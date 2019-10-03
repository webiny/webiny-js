// @flow
/* global window */

import type { FileUploaderPlugin } from "@webiny/app/types";

export default (config: Object = {}): FileUploaderPlugin => ({
    type: "file-uploader",
    name: "file-uploader",
    upload: async (file: File) => {
        const uri = config.uri || "https://9qaw9vy7d0.execute-api.us-east-1.amazonaws.com/prod/upload";

        const presignedPostPayload = await new Promise(resolve => {
            const xhr = new window.XMLHttpRequest();
            xhr.open("POST", uri, true);
            xhr.send(JSON.stringify({ size: file.size, name: file.name, type: file.type }));
            xhr.onload = function() {
                resolve(JSON.parse(this.responseText));
            };
        });

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
