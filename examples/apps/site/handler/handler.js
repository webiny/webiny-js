import serveError from "./utils/serveError";
import serveFile from "./utils/serveFile";
import serveSsrCache from "./utils/serveSsrCache";
import mime from "mime-types";

export const handler = async event => {
    try {
        if (mime.lookup(event.path)) {
            return serveFile(event);
        }

        return serveSsrCache(event);
    } catch (e) {
        // An error occurred, serve the error.
        return serveError(e);
    }
};
