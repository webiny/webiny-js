import serveError from "./utils/serveError";
import serveFile from "./utils/serveFile";
import ssr from "./utils/ssr";
import mime from "mime-types";

export const handler = async event => {
    try {
        if (mime.lookup(event.path)) {
            return serveFile(event);
        }

        return ssr(event);
    } catch (e) {
        // An error occurred, serve the error.
        return serveError(e);
    }
};
