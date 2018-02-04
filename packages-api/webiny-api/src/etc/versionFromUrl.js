// @flow
import type { express$Request } from "../../flow-typed/npm/express_v4.x.x";

/**
 * Creates a function to determine the api version from the headers
 * @return {Function}
 */
export default () => {
    /**
     * Attempts to determine the api version from the URL
     * @param {express$Request} req
     * @return {string}
     */
    return (req: express$Request): string => {
        const match = req.url.match(/^\/v(.*?)\//);
        if (match) {
            return match[1];
        }

        return "latest";
    };
};
