const get = require("lodash/get");
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
            "~tests",
            "~",
            "async_hooks",
            "aws-sdk",
            "buffer",
            "child_process",
            "crypto",
            "events",
            "follow-redirects",
            "fs",
            "http",
            "https",
            "os",
            "path",
            "readline",
            "stream",
            "util",
            "url",
            "worker_threads"
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
