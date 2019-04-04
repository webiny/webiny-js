// @flow
import fs from "fs-extra";
import uniqueId from "uniqid";
import decodeBase64Src from "./utils/decodeBase64Src";
import mime from "mime-types";
import sanitizeFilename from "sanitize-filename";
import sharp from "sharp";

const supportedImageTypes = ["image/jpg", "image/jpeg", "image/png"];

const compressImage = async ({ buffer, type }): Promise<{ buffer: Buffer, type: string }> => {
    if (type === "image/png") {
        return {
            buffer: await sharp(buffer)
                .resize({ width: 1920, height: 1440, withoutEnlargement: true, fit: "inside" })
                .png({ compressionLevel: 9, adaptiveFiltering: true, force: true })
                .withMetadata()
                .toBuffer(),
            type
        };
    }

    return {
        buffer: await sharp(buffer)
            .resize({ width: 1920, height: 1440, withoutEnlargement: true, fit: "inside" })
            .toFormat("jpeg", { quality: 90 })
            .toBuffer(),
        type: "image/jpeg"
    };
};

const filenameWithoutExtension = (value: ?string) => {
    return typeof value === "string" ? value.replace(/\.[^/.]+$/, "") : "";
};

const create = async (options: Object) => {
    const { src } = options;

    if (!src) {
        throw Error(`Cannot create file, "src" is missing.`);
    }

    const pwd: string = (process.env.PWD: any);
    const paths = {
        url: `/files/`,
        folder: `${pwd}/static/`
    };

    fs.ensureDir(paths.folder);

    let { buffer, type } = decodeBase64Src(options.src);

    // If we are dealing with an image, compress it.
    if (supportedImageTypes.includes(type)) {
        const image = await compressImage({ buffer, type });
        buffer = image.buffer;
        type = image.type;
    }

    // Generate unique filename.
    const extension: string = mime.extension(type);
    let name = filenameWithoutExtension(options.name);
    name += name ? "_" : "";
    name += `${uniqueId()}.${extension}`;
    name = sanitizeFilename(name);

    await fs.writeFile(paths.folder + name, buffer);

    const metadata = await sharp(buffer).metadata();

    const data: Object = {
        name,
        type,
        size: buffer.byteLength,
        src: paths.url + name,
        meta: {}
    };

    if (supportedImageTypes.includes(type)) {
        data.meta.width = metadata.width;
        data.meta.height = metadata.height;
        data.meta.aspectRatio = metadata.width / metadata.height;
    }

    return data;
};

export default create;
