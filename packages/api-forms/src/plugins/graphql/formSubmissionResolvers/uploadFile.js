// @flow
import got from "got";
import FormData from "form-data";

type FileType = { size: number, name: string, type: string, src: Buffer };

export default async (file: FileType) => {
    // $FlowFixMe
    const FUNCTIONS_HOST: string = process.env.FUNCTIONS_HOST;

    // Let's save the CSV file
    const { body } = await got(FUNCTIONS_HOST + "/files", {
        method: "post",
        json: true,
        body: {
            size: file.size,
            name: file.name,
            type: file.type
        }
    });

    if (body.code !== "FILE_UPLOAD_SUCCESS") {
        throw new Error(body.data.message);
    }

    const formData = new FormData();
    Object.keys(body.data.s3.fields).forEach(key => {
        formData.append(key, body.data.s3.fields[key]);
    });

    formData.append("file", file.src);

    try {
        await got(FUNCTIONS_HOST + body.data.s3.url, {
            method: "post",
            body: formData
        });

        return body.data.file;

        // TODO: Save file into file manager?
        // TODO: what about files piling up? some kind of TTL policy would be nice here?
    } catch (e) {
        throw new Error("File upload could not be completed: " + e.message);
    }
};
