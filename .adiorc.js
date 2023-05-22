const get = require("lodash.get");
const getWorkspaces = require("get-yarn-workspaces");
const path = require("path");

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
        src: [
            "http",
            "path",
            "https",
            "follow-redirects",
            "child_process",
            "os",
            "buffer",
            "fs",
            "readline",
            "util",
            "events",
            "crypto",
            "aws-sdk",
            "url",
            "worker_threads",
            "~tests",
            "~"
        ],
        dependencies: [
            "@babel/runtime",
            // Packages below are defined as peerDependencies in many 3rd party packages
            // and make yarn go crazy with warnings. We define these packages as "dependencies"
            // in our own packages, but we don't directly use them:
            "@emotion/react",
            "@svgr/webpack",
            "@types/react",
            "@webiny/cli",
            "prop-types",
            "apollo-cache",
            "apollo-client",
            "apollo-link",
            "apollo-utilities",
            "graphql",
            "react-dom"
        ],
        devDependencies: true,
        peerDependencies: true
    },
    ignoreDirs: ["node_modules/", "dist/", "build/"],
    packages: getWorkspaces().map(pkg =>
        pkg.replace(/\//g, path.sep).replace(process.cwd() + path.sep, "")
    )
};
