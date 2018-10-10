// @flow
import fs from "fs-extra";
import sharp from "sharp";
import uniqueId from "uniqid";
import decodeBase64Src from "./utils/decodeBase64Src";
import mime from "mime-types";
import sanitizeFilename from "sanitize-filename";

/**
 * Saves files to local file system - suitable for local development needs.
 * @type {{create(): Promise<*>, read(*, *): Promise<*>}}
 */
const localStoragePlugin: FilesServicePlugin = {
    async create(src, options = {}) {
        if (!src) {
            throw Error(`Cannot create image, "src" is missing.`);
        }

        const pwd: string = (process.env.PWD: any);
        const paths = {
            url: `http://localhost:9000/files/`,
            folder: `${pwd}/static/`
        };

        fs.ensureDir(paths.folder);

        const { buffer, type } = decodeBase64Src(src);
        const extension: string = mime.extension(type);

        // Generate unique filename.
        let name = options.name;
        if (name) {
            // Remove extension.
            name =
                name
                    .split(".")
                    .slice(0, -1)
                    .join(".") + "_";
        }
        name += `${uniqueId()}.${extension}`;
        name = sanitizeFilename(name).replace(/\s/g, "");

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
