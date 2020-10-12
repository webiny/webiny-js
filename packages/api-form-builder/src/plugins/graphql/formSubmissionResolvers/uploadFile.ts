import got from "got";
import FormData from "form-data";
import { CREATE_FILE, UPLOAD_FILE } from "./graphql";
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
        let uploadFile = await context.handlerClient.invoke({
            name: process.env.FILE_MANAGER_FUNCTION,
            payload: {
                httpMethod: "POST",
                headers: {
                    Authorization: context.token
                },
                body: {
                    query: UPLOAD_FILE,
                    variables: {
                        data: file
                    }
                }
            }
        });

        uploadFile = get(uploadFile, "data.files.uploadFile");
        if (uploadFile.error) {
            throw new Error(uploadFile.error.message);
        }

        await uploadToS3(buffer, uploadFile.data.data);

        let createFile = await context.handlerClient.invoke({
            name: process.env.FILE_MANAGER_FUNCTION,
            payload: {
                httpMethod: "POST",
                headers: {
                    Authorization: context.token
                },
                body: {
                    query: CREATE_FILE,
                    variables: {
                        data: { ...uploadFile.data.file, meta: { private: true } }
                    }
                }
            }
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
