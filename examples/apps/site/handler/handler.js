import mime from "mime-types";
import serveError from "./utils/serveError";
import serveFile from "./utils/serveFile";
import serveCachedPageSsr from "./utils/serveCachedPageSsr";

export const handler = async event => {
    const { path } = event;

    try {
        let type = mime.lookup(path);

        if (type) {
            return serveFile(path);
        }

        return serveCachedPageSsr(path);
    } catch (e) {
        // An error occurred, serve the error.
        return serveError(e);
    }
};
