import _ from "lodash";

export default (resolve = {}) => {
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
