import { FbFormCreatedFileResult, FbFormUploadedFileResult } from "@webiny/api-form-builder/types";
import got from "got";
import FormData from "form-data";
import { CREATE_FILE, UPLOAD_FILE } from "./graphql";
import { GraphQLClient } from "graphql-request";

const uploadToS3 = async (buffer, preSignedPostPayload) => {
    const formData = new FormData();
    Object.keys(preSignedPostPayload.fields).forEach(key => {
        formData.append(key, preSignedPostPayload.fields[key]);
    });

    formData.append("file", buffer);

    return got(preSignedPostPayload.url, {
        method: "post",
        body: formData
    });
};

export default async ({ context, buffer, file }) => {
    try {
        const client = new GraphQLClient(context.event.headers["x-webiny-apollo-gateway-url"], {
            headers: {
                Authorization: context.token
            }
        });

        const uploadFileResult = await client.request<FbFormUploadedFileResult>(UPLOAD_FILE, {
            data: file
        });

        const uploadFile = uploadFileResult?.files?.uploadFile;
        if (!uploadFile) {
            throw new Error("Missing uploaded file result data.");
        }

        if (uploadFile.error) {
            throw new Error(uploadFile.error.message);
        }

        await uploadToS3(buffer, uploadFile.data.data);

        const createFileResult = await client.request<FbFormCreatedFileResult>(CREATE_FILE, {
            data: { ...uploadFile.data.file, meta: { private: true } }
        });

        const createFile = createFileResult?.files?.createFile;
        if (!createFile) {
            throw new Error("Missing created file result data.");
        }
        if (createFile.error) {
            throw new Error(createFile.error.message);
        }

        return createFile.data;
    } catch (e) {
        throw new Error("File upload could not be completed: " + e.message);
    }
};
