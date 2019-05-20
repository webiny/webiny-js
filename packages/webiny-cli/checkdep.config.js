module.exports = {
    ignoredDirs: ["/node_modules/", "/template/packages/"],
    ignore: {
        dependencies: ["cross-env", "graphql"],
        src: ["os", "path", "crypto", "util"]
    }
};
