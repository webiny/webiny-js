import fs from "fs";
import path from "path";
import isUtf8 from "isutf8";
import createResponse from "./createResponse";

const serveFile = async key => {
    const filePath = path.resolve(key);

    let buffer = await new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });

    const isBase64Encoded = !isUtf8(buffer);
    const headers = {};

    if (key.includes("static")) {
        headers["Cache-Control"] = "public, max-age=2592000";
    }

    return createResponse({
        type,
        body: buffer.toString(isBase64Encoded ? "base64" : "utf8"),
        isBase64Encoded,
        headers
    });
};

export default serveFile;
