// @flow
import type { express$Request } from "../../flow-typed/npm/express_v4.x.x";

/**
 * Creates a function to determine the api version from the headers
 * @param {string} header
 * @return {Function}
 */
export default (header: string) => {
    /**
     * Attempts to determine the api version from the headers
     * @param {express$Request} req
     * @return {string}
     */
    return (req: express$Request): string => {
        const version = req.header(header);
        return version || "latest";
    };
};
