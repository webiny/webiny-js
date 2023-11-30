import FormData from "form-data";
import fetch, { Response } from "node-fetch";
import { PresignedPost } from "@webiny/aws-sdk/client-s3";

export default async (buffer: Buffer, preSignedPostPayload: PresignedPost): Promise<Response> => {
    const formData = new FormData();
    // Add all pre signed payload field to "FormData".
    Object.keys(preSignedPostPayload.fields).forEach(key => {
        formData.append(key, preSignedPostPayload.fields[key]);
    });
    // Add file content to "FormData".
    formData.append("file", buffer);
    // Finally make the upload request to S3.
    return fetch(preSignedPostPayload.url, {
        method: "POST",
        body: formData
    });
};
