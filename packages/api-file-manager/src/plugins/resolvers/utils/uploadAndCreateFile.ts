import FormData from "form-data";
import fetch from "node-fetch";
import createFileResolver from "../createFile";
import uploadFileResolver from "../uploadFile";

const checkStatus = res => {
    if (res.ok) {
        // res.status >= 200 && res.status < 300
        return res;
    } else {
        throw Error(res.statusText);
    }
};

const uploadToS3 = async (buffer, preSignedPostPayload) => {
    const formData = new FormData();
    Object.keys(preSignedPostPayload.fields).forEach(key => {
        formData.append(key, preSignedPostPayload.fields[key]);
    });

    formData.append("file", buffer);

    return fetch(preSignedPostPayload.url, {
        method: "POST",
        body: formData
    });
};

export default async ({ context, buffer, file }) => {
    try {
        const uploadFileResponse = await uploadFileResolver(null, { data: file }, context, null);

        if (uploadFileResponse.error) {
            throw new Error(uploadFileResponse.error.message);
        }

        const uploadToS3Response = await uploadToS3(buffer, uploadFileResponse.data.data);
        checkStatus(uploadToS3Response);

        const createFileResponse = await createFileResolver(
            null,
            {
                data: { ...uploadFileResponse.data.file, meta: { private: true } }
            },
            context,
            null
        );

        if (createFileResponse.error) {
            throw new Error(createFileResponse.error.message);
        }

        const fileData = await createFileResponse.data.toJSON();
        const src = context?.fileManager?.settings?.srcPrefix + fileData.key;

        return {
            ...fileData,
            src
        };
    } catch (e) {
        throw new Error("File upload could not be completed: " + e.message);
    }
};
