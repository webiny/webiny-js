import { createResponse } from "@webiny/api-web-server";
import mime from "mime-types";

const DEFAULT_CACHE_MAX_AGE = 300; // 5 minutes.

export default ({ fileLoader, cacheMaxAge = DEFAULT_CACHE_MAX_AGE } = {}) => ({
    type: "handler",
    name: "handler-index",
    async handle({event}) {
        if (mime.lookup(event.path)) {
            return
        }

        const type = "text/html";
        const key = "index.html";

        try {
            const buffer = await fileLoader(key);
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
