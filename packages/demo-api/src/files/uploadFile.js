// @flow
import fs from "fs";
import crypto from "crypto";
import path from "path";

const decodeBase64Src = (dataString: string): { type: string, data: Buffer } => {
    // eslint-disable-next-line
    const matches: ?Array<string> = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const response = {};

    if (!Array.isArray(matches)) {
        throw Error("Invalid input string");
    }

    if (!matches[1]) {
        throw Error("Could not read file type.");
    }

    if (!matches[2]) {
        throw Error("Could not read file content.");
    }

    response.type = matches[1];
    response.data = new Buffer(matches[2], "base64");

    return response;
};

const writeFile = (fileBuffer, userUploadedImagePath): Promise<void> => {
    return new Promise((resolve, reject) => {
        fs.writeFile(userUploadedImagePath, fileBuffer.data, error => {
            if (error) {
                return reject(error);
            }

            resolve();
        });
    });
};

const generateRandomFilename = (): string => {
    // Generate random string
    const seed = crypto.randomBytes(20);
    const uniqueSHA1String = crypto
        .createHash("sha1")
        .update(seed)
        .digest("hex");
    return "file-" + uniqueSHA1String;
};

export default async function uploadFile(data: Object) {
    const pwd: string = (process.env.PWD: any);
    const paths = {
        url: `http://localhost:8000/`,
        folder: `${pwd}/static/`
    };

    // Save decoded binary image to disk.
    if (!fs.existsSync(paths.folder)) {
        fs.mkdirSync(paths.folder);
    }

    const randomFilename = generateRandomFilename();
    const imageBuffer = decodeBase64Src(data.src);

    const extension: string = path.extname(data.name);
    const src = paths.folder + randomFilename + extension;

    await writeFile(imageBuffer, src);

    return {
        name: data.name,
        size: data.size,
        type: data.type,
        src: paths.url + randomFilename + extension
    };
}
