// @flow
import got from "got";
import FormData from "form-data";
import { CREATE_FILE, UPLOAD_FILE } from "./graphql";
import { GraphQLClient } from "graphql-request";
import { get } from "lodash";

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
        const client = new GraphQLClient(process.env.FILES_API_URL, {
            headers: {
                Authorization: context.token
            }
        });

        let uploadFile = await client.request(UPLOAD_FILE, {
            data: file
        });

        uploadFile = get(uploadFile, "files.uploadFile");
        if (uploadFile.error) {
            throw new Error(uploadFile.error.message);
        }

        await uploadToS3(buffer, uploadFile.data.data);

        let createFile = await client.request(CREATE_FILE, {
            data: { ...uploadFile.data.file, meta: { private: true } }
        });

        createFile = get(createFile, "files.createFile");
        if (createFile.error) {
            throw new Error(createFile.error.message);
        }

        return createFile.data;
    } catch (e) {
        throw new Error("File upload could not be completed: " + e.message);
    }
};
