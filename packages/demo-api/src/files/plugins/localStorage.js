// @flow
import type { FilesServicePlugin } from "./../types";
import fs from "fs-extra";
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

        const pwd: string = (process.env.PWD: any);
        const paths = {
            url: `http://localhost:9000/files/`,
            folder: `${pwd}/static/`
        };

        fs.ensureDir(paths.folder);

        const { buffer, type } = decodeBase64Src(data);
        const extension: string = mime.extension(type);
        const name = `${randomString.generate()}.${extension}`;

        await fs.writeFile(paths.folder + name, buffer);

        return {
            name,
            type,
            size: buffer.byteLength,
            src: paths.url + name
        };
    },
    async read(src, options) {
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
    }
};

export default localStoragePlugin;
