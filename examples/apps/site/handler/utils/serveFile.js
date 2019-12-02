import fs from "fs";
import path from "path";
import isUtf8 from "isutf8";
import createResponse from "./createResponse";

const serveFile = async key => {
    const filePath = path.resolve(key);

    try {
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
    } catch (e) {
        console.log(e.stack);
        return {
            statusCode: 404,
            body: e.message,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "no-store"
            }
        };
    }
};

export default serveFile;
