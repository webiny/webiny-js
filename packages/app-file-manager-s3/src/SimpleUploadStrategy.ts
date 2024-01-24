import { UploadedFile, UploadOptions } from "@webiny/app/types";
import { GET_PRE_SIGNED_POST_PAYLOAD } from "./graphql";
import { FileUploadStrategy } from "~/index";

declare global {
    interface File {
        key?: string;
        keyPrefix?: string;
    }
}

export class SimpleUploadStrategy implements FileUploadStrategy {
    async upload(file: File, { apolloClient, onProgress }: UploadOptions): Promise<UploadedFile> {
        // 1. GET PreSignedPostPayload
        const response = await apolloClient.query({
            query: GET_PRE_SIGNED_POST_PAYLOAD,
            fetchPolicy: "no-cache",
            variables: {
                data: {
                    size: file.size,
                    name: file.name,
                    type: file.type,
                    key: file.key,
                    keyPrefix: file.keyPrefix
                }
            }
        });

        const { getPreSignedPostPayload } = response.data.fileManager;
        if (getPreSignedPostPayload.error) {
            console.error(getPreSignedPostPayload);
            throw Error(getPreSignedPostPayload.error);
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
                        onProgress({
                            sent: event.loaded,
                            total: file.size,
                            percentage: (event.loaded / file.size) * 100
                        });
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
