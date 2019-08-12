const nodeExternals = require("webpack-node-externals");

/**
 * Why this exists?
 * Serverless-Offline is clearing cache and re-requiring packages that are not inside node_modules.
 * Since this repo consists of A LOT of packages that are bundled and re-required during development
 * we need to reduce the size of the bundle and only include what is necessary.
 *
 * By only including the actual repo packages we will leave a much smaller memory footprint
 * and sls-offline will not run out of memory on subsequent re-requires of webpack bundles.
 */

module.exports = () => {
    return nodeExternals({
        // This means "add matching packages to the bundle"
        whitelist: [/^webiny/, /^@webiny/, /^demo/]
    });
};
