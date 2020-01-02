import { createResponse } from "@webiny/api-web-server";
import mime from "mime-types";
import isUtf8 from "isutf8";

const DEFAULT_CACHE_MAX_AGE = 2592000; // 30 days.

export default ({ fileLoader, cacheMaxAge = DEFAULT_CACHE_MAX_AGE } = {}) => ({
    type: "handler",
    name: "handler-files",
    async handle({ event }) {
        const type = mime.lookup(event.path);
        if (!type) {
            return;
        }

        try {
            let { key } = event.pathParameters;
            const buffer = await fileLoader(key );
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
