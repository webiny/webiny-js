import { createResponse } from "@webiny/http-handler";
import mime from "mime-types";
import isUtf8 from "isutf8";
import path from "path";
import fs from "fs";

const DEFAULT_CACHE_MAX_AGE = 2592000; // 30 days.

const load = (pathToResolve): Promise<Buffer> => {
    const pathToRead = path.resolve(pathToResolve);
    return new Promise((resolve, reject) => {
        fs.readFile(pathToRead, (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
};

export default ({ cacheMaxAge = DEFAULT_CACHE_MAX_AGE } = {}) => ({
    type: "handler",
    name: "handler-files",
    canHandle({ args }) {
        const [event] = args;
        return event.httpMethod === "GET" && mime.lookup(event.path);
    },
    async handle({ args }) {
        const [event] = args;

        try {
            const { key } = event.pathParameters;
            const buffer = await load(key);
            if (buffer) {
                const isBase64Encoded = !isUtf8(buffer);
                return createResponse({
                    type: mime.lookup(event.path),
                    body: buffer.toString(isBase64Encoded ? "base64" : "utf8"),
                    isBase64Encoded,
                    headers: { "Cache-Control": "public, max-age=" + cacheMaxAge }
                });
            }
        } catch {
            // Do nothing.
        }

        return createResponse({
            statusCode: 404,
            type: "text/plain",
            body: "Not found.",
            headers: {
                "Cache-Control": "public, max-age=" + cacheMaxAge
            }
        });
    }
});
