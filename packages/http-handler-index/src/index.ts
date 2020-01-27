import { createResponse } from "@webiny/http-handler";
import mime from "mime-types";
import path from "path";
import fs from "fs";
import { HttpHandlerPlugin } from "@webiny/http-handler/types";
import zlib from "zlib";

const DEFAULT_CACHE_MAX_AGE = 300; // 5 minutes.

const load = (pathToResolve): Promise<Buffer> => {
    const pathToRead = path.resolve(pathToResolve);
    return new Promise((resolve, reject) => {
        fs.readFile(pathToRead, (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
};

export default ({ cacheMaxAge = DEFAULT_CACHE_MAX_AGE } = {}): HttpHandlerPlugin => ({
    type: "handler",
    name: "handler-index",
    canHandle({ args }) {
        const [event] = args;
        return event.httpMethod === "GET" && !mime.lookup(event.path);
    },
    async handle() {
        const type = "text/html";
        const key = "index.html";

        try {
            let buffer = await load(key);
            if (buffer) {
                buffer = zlib.gzipSync(buffer);
                return createResponse({
                    type,
                    isBase64Encoded: true,
                    body: buffer.toString("base64"),
                    headers: {
                        "Cache-Control": "public, max-age=" + cacheMaxAge,
                        "Content-Encoding": "gzip"
                    }
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
