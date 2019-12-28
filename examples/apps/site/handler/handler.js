import mime from "mime-types";
import serveError from "./utils/serveError";
import serveFile from "./utils/serveFile";
import serveCachedPageSsr from "./utils/serveCachedPageSsr";
import invalidateSsrCache from "./utils/invalidateSsrCache";

export const handler = async event => {
    if (event.method === 'POST') {
        return invalidateSsrCache(event);
    }

    try {
        if (mime.lookup(event.path)) {
            return serveFile(event);
        }

        return serveCachedPageSsr(event);
    } catch (e) {
        // An error occurred, serve the error.
        return serveError(e);
    }
};
