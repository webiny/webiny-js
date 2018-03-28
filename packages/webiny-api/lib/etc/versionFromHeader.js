"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

/**
 * Creates a function to determine the api version from the headers
 * @param {string} header
 * @return {Function}
 */
exports.default = header => {
    /**
     * Attempts to determine the api version from the headers
     * @param {express$Request} req
     * @return {string}
     */
    return req => {
        const version = req.header(header);
        return version || "latest";
    };
};
//# sourceMappingURL=versionFromHeader.js.map
