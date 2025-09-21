import type { PresignedPost } from "@webiny/aws-sdk/client-s3/index.js";

export default async (buffer: Buffer, preSignedPostPayload: PresignedPost): Promise<Response> => {
    const formData = new FormData();

    for (const [key, value] of Object.entries(preSignedPostPayload.fields)) {
        formData.append(key, value);
    }

    formData.append("file", new Blob([Buffer.from(buffer)]));

    return fetch(preSignedPostPayload.url, {
        method: "POST",
        body: formData
    });
};
