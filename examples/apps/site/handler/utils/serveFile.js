import fs from "fs";
import path from "path";
import isUtf8 from "isutf8";
import createResponse from "./createResponse";
import mime from "mime-types";

const serveFile = async event => {
    let { key } = event.pathParameters;
    const filePath = path.resolve(key);

    try {
        let buffer = await new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err) return reject(err);
                resolve(data);
            });
        });

        const isBase64Encoded = !isUtf8(buffer);

        return createResponse({
            type: mime.lookup(key),
            body: buffer.toString(isBase64Encoded ? "base64" : "utf8"),
            isBase64Encoded,
            headers: { "Cache-Control": "public, max-age=2592000" }
        });
    } catch (e) {
        return createResponse({
            statusCode: 404,
            type: "text/plain",
            body: "Not found.",
            headers: {
                "Cache-Control": "public, max-age=2592000"
            }
        });
    }
};

export default serveFile;
