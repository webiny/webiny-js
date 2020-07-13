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
        "api/apolloGateway",
        "api/settingsManager",
        "api/databaseProxy",
        "api/files/*",
        "api/formBuilder",
        "api/cms/*",
        "api/i18n/*",
        "api/pageBuilder",
        "api/security/*"
    ]
};
