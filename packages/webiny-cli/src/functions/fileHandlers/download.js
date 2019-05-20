import fs from "fs-extra";
import sharp from "sharp";
import mime from "mime-types";
import path from "path";

const UPLOADS_FOLDER = process.env.UPLOADS_FOLDER || ".files";

export const handler = async ({ pathParameters, queryStringParameters }) => {
    const { key } = pathParameters;
    const type = mime.lookup(key);

    try {
        const folder = path.resolve(UPLOADS_FOLDER);

        let buffer = await fs.readFile(path.join(folder, "/", key));
        if (queryStringParameters) {
            // If an image was requested, we can apply additional image processing.
            const { width, height } = queryStringParameters;
            if (width || height) {
                const supportedImageTypes = ["image/jpg", "image/jpeg", "image/png"];
                if (supportedImageTypes.includes(type)) {
                    buffer = await sharp(buffer)
                        .resize({ width: parseInt(width), height: parseInt(height) })
                        .toBuffer();
                }
            }
        }

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": type
            },
            body: buffer
        };
    } catch (e) {
        return {
            statusCode: 404,
            headers: {
                "Access-Control-Allow-Origin": "*"
            }
        };
    }
};
