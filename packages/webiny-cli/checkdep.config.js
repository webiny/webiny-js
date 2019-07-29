module.exports = {
    ignoredDirs: ["/node_modules/", "/template/packages/"],
    ignore: {
        dependencies: [
            "cross-env",
            "graphql",
            "@babel/core",
            "@babel/plugin-proposal-class-properties",
            "@babel/plugin-transform-runtime",
            "@babel/plugin-proposal-object-rest-spread"
        ],
        src: ["os", "path", "crypto", "util"]
    }
};
