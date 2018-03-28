"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

/**
 * Creates a function to determine the api version from the headers
 * @return {Function}
 */
exports.default = () => {
    /**
     * Attempts to determine the api version from the URL
     * @param {express$Request} req
     * @return {string}
     */
    return req => {
        const match = req.url.match(/^\/v(.*?)\//);
        if (match) {
            return match[1];
        }

        return "latest";
    };
};
//# sourceMappingURL=versionFromUrl.js.map
