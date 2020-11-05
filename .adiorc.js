const get = require("lodash.get");

module.exports = {
    parser: {
        plugins: ["jsx", "classProperties", "dynamicImport", "throwExpressions", "typescript"]
    },
    traverse: ({ path, push }) => {
        const { node } = path;
        if (node.type === "CallExpression") {
            if (
                get(node, "callee.property.name") === "resolve" &&
                get(node, "callee.object.name") === "require"
            ) {
                const possiblePackage = get(node, "arguments.0.value");
                if (typeof possiblePackage === "string") {
                    return push(possiblePackage);
                }
            }
        }
    },
    ignore: {
        src: ["path", "os", "fs", "util", "events", "crypto", "aws-sdk"],
        dependencies: ["@babel/runtime"],
        devDependencies: true,
        peerDependencies: true
    },
    ignoreDirs: ["node_modules/", "dist/", "build/"],
    packages: ["packages/*", "api/code/api", "apps/admin/code", "apps/site/code"]
};
