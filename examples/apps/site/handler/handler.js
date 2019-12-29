import mime from "mime-types";
import serveError from "./utils/serveError";
import serveFile from "./utils/serveFile";
import serveCachedPageSsr from "./utils/serveCachedPageSsr";

export const handler = async event => {
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
