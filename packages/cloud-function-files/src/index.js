import { createResponse } from "@webiny/cloud-function";
import mime from "mime-types";
import isUtf8 from "isutf8";
import path from "path";
import fs from "fs";

const DEFAULT_CACHE_MAX_AGE = 2592000; // 30 days.

const load = pathToResolve => {
    const pathToRead = path.resolve(pathToResolve);
    return new Promise((resolve, reject) => {
        fs.readFile(pathToRead, (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
};

export const files = ({ cacheMaxAge = DEFAULT_CACHE_MAX_AGE } = {}) => ({
    type: "run",
    name: "run-files",
    async handle({ args }) {
        const [event] = args;
        const type = mime.lookup(event.path);
        if (!type) {
            return;
        }

        try {
            let { key } = event.pathParameters;
            const buffer = await load(key);
            if (buffer) {
                const isBase64Encoded = !isUtf8(buffer);
                return createResponse({
                    type,
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
