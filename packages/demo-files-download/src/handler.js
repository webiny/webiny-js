// @flow
import fs from "fs-extra";
import sharp from "sharp";
import mime from "mime-types";

export const handler = async (event, { req }) => {
    const { key } = req.params;
    const options = req.query;
    const type = mime.lookup(key);

    try {
        let buffer = await fs.readFile(`${process.cwd()}/packages/demo-api/static/${key}`);
        if (options) {
            // If an image was requested, we can apply additional image processing.
            const { width, height } = options;
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
