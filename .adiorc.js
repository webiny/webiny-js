const get = require("lodash.get");
const LOAD_COMPONENTS_PREFIX = ["@webiny/", "@serverless/"];

module.exports = {
    parser: {
        plugins: ["jsx", "classProperties", "dynamicImport", "throwExpressions", "typescript"]
    },
    traverse: ({ path, push }) => {
        // We try to detect "this.load("...")" calls inside of Serverless components.
        const { node } = path;
        if (node.type === "CallExpression") {
            if (get(node, "callee.property.name") === "load") {
                const possiblePackage = get(node, "arguments.0.value");
                if (typeof possiblePackage === "string") {
                    LOAD_COMPONENTS_PREFIX.forEach(prefix => {
                        if (possiblePackage.startsWith(prefix)) {
                            return push(possiblePackage);
                        }
                    });
                }
            }

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
        devDependencies: true
    },
    ignoreDirs: ["node_modules/", "dist/", "build/"],
    packages: [
        "packages/*",
        "sample-project/api/apolloGateway",
        "sample-project/api/settingsManager",
        "sample-project/api/databaseProxy",
        "sample-project/api/files/*",
        "sample-project/api/formBuilder",
        "sample-project/api/cms/*",
        "sample-project/api/i18n/*",
        "sample-project/api/pageBuilder",
        "sample-project/api/security/*"
    ]
};
