// @flow
import fs from "fs-extra";
import sharp from "sharp";
import mime from "mime-types";

const read = async (src: string, options: Object = {}) => {
    const pwd: string = (process.env.PWD: any);

    let buffer = await fs.readFile(`${pwd}/static/${src}`);
    const type = mime.lookup(src);

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

    return { src: buffer, type };
};

export default read;
