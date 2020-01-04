import { createResponse } from "@webiny/cloud-function";
import mime from "mime-types";
import path from "path";
import fs from "fs";

const DEFAULT_CACHE_MAX_AGE = 300; // 5 minutes.

const load = pathToResolve => {
    const pathToRead = path.resolve(pathToResolve);
    return new Promise((resolve, reject) => {
        fs.readFile(pathToRead, (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
};

export const index = ({ cacheMaxAge = DEFAULT_CACHE_MAX_AGE } = {}) => ({
    type: "run",
    name: "run-index",
    async handle({ args }) {
        const [event] = args;
        if (mime.lookup(event.path)) {
            return;
        }

        const type = "text/html";
        const key = "index.html";

        try {
            const buffer = await load(key);
            if (buffer) {
                return createResponse({
                    type,
                    body: buffer.toString("utf8"),
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
