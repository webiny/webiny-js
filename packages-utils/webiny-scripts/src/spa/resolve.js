const _ = require("lodash");

module.exports = (resolve = {}) => {
    return _.merge(
        {},
        {
            alias: {},
            extensions: [".jsx", ".js", ".css", ".scss"],
            modules: ["node_modules"]
        },
        resolve
    );
};
