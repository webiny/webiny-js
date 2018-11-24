// @flow
import fs from "fs-extra";
import uniqueId from "uniqid";
import decodeBase64Src from "./utils/decodeBase64Src";
import mime from "mime-types";
import sanitizeFilename from "sanitize-filename";

const create = async (src: string, options: Object = {}) => {
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
    let name = options.name || "";
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
};

export default create;
