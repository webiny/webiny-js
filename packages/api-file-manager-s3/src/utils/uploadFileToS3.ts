import FormData from "form-data";
import fetch from "node-fetch";

export default async (buffer, preSignedPostPayload) => {
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
