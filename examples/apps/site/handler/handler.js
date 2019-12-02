import mime from "mime-types";
import serveError from "./utils/serveError";
import serveFile from "./utils/serveFile";
import servePageSsr from "./utils/servePageSsr";
import serveCachedPageSsr from "./utils/serveCachedPageSsr";

export const handler = async ({ headers, pathParameters }) => {
    try {
        let key = pathParameters ? pathParameters.key : "";
        let type = mime.lookup(key);

        // 1. Check if we received "X-Pb-Ssr" header - this means we must return SSR HTML.
        let mustServeSsr = false;
        for (let key in headers) {
            if (key.toLowerCase() === "x-pb-ssr") {
                mustServeSsr = true;
                break;
            }
        }

        if (mustServeSsr) {
            // Otherwise, we received an app URL, so let's get the SSR.
            return servePageSsr(key);
        }

        // If there is a type, that means we need to serve a file.
        if (type) {
            return serveFile(key);
        }

        // Otherwise, we received an app URL, so let's get the SSR.
        return serveCachedPageSsr(key);
    } catch (e) {
        // An error occurred, serve the error.
        return serveError(e);
    }
};
