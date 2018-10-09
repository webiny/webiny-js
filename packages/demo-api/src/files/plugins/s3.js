// @flow
import type { FilesServicePlugin } from "./../types";
import sharp from "sharp";
import randomString from "randomstring";
import decodeBase64Src from "./utils/decodeBase64Src";
import mime from "mime-types";

/**
 * Saves files to local file system - suitable for local development needs.
 * @type {{create(): Promise<*>, read(*, *): Promise<*>}}
 */
const localStoragePlugin: FilesServicePlugin = {
    async create(data) {
        if (!data) {
            throw Error(`Cannot create image, "src" is missing.`);
        }

        const { buffer, type } = decodeBase64Src(data);
        const extension: string = mime.extension(type);
        const name = `${randomString.generate()}.${extension}`;

        // TODO: Upload to user's S3 bucket.

        return {
            name,
            type,
            size: buffer.byteLength,
            src: "https://s3.aws.com/image.jpg"
        };
    },
    async read(src, options) {
        // TODO: Read from user's S3 bucket.
        let buffer = new Buffer("srcFromS3");
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
    }
};

export default localStoragePlugin;
