import mime from "mime-types";
import isUtf8 from "isutf8";
import path from "path";
import fs from "fs";
import zlib from "zlib";
import { HandlerPlugin } from "@webiny/handler/types";
import { HandlerHttpContext } from "@webiny/handler-http/types";

const DEFAULT_CACHE_MAX_AGE = 2592000; // 30 days.

const load = (pathToResolve): Promise<Buffer> => {
    const pathToRead = path.resolve(pathToResolve);
    return new Promise((resolve, reject) => {
        fs.readFile(pathToRead, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(data);
        });
    });
};

export default ({ cacheMaxAge = DEFAULT_CACHE_MAX_AGE } = {}): HandlerPlugin<
    HandlerHttpContext
> => ({
    type: "handler",
    name: "handler-files",
    async handle(context, next) {
        const { http } = context;

        if (!(http.method === "GET" && mime.lookup(http.path.base))) {
            return next();
        }

        try {
            const { key } = http.path.parameters;
            let buffer = await load(key);
            if (buffer) {
                const headers = {
                    "Cache-Control": "public, max-age=" + cacheMaxAge,
                    "Content-Type": mime.lookup(http.path.base)
                };

                if (isUtf8(buffer)) {
                    buffer = zlib.gzipSync(buffer);
                    headers["Content-Encoding"] = "gzip";
                }

                return http.response({
                    body: buffer.toString("base64"),
                    // @ts-ignore TODO: check this
                    isBase64Encoded: true,
                    headers
                });
            }
        } catch {
            // Do nothing.
        }

        return http.response({
            statusCode: 404,
            body: "Not found.",
            headers: {
                "Cache-Control": "public, max-age=" + cacheMaxAge,
                "Content-Type": "text/plain"
            }
        });
    }
});
