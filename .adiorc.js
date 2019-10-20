const get = require("lodash.get");
const LOAD_COMPONENTS_PREFIX = ["@webiny/", "@serverless/"];

module.exports = {
    parser: {
        plugins: ["jsx", "classProperties", "dynamicImport", "flow"]
    },
    traverse: ({ path, push }) => {
        // We try to detect "this.load("...")" calls inside of Serverless components.
        const { node } = path;
        if (node.type === "CallExpression" && get(node, "callee.property.name") === "load") {
            const possiblePackage = get(node, "arguments.0.value");
            if (typeof possiblePackage === "string") {
                LOAD_COMPONENTS_PREFIX.forEach(prefix => {
                    if (possiblePackage.startsWith(prefix)) {
                        return push(possiblePackage);
                    }
                });
            }
        }
    },
    ignore: {
        src: ["path", "os", "fs", "util", "events", "crypto"],
        dependencies: ["@babel/runtime"],
        devDependencies: true
    },
    ignoreDirs: ["node_modules", "dist"],
    packages: ["packages/*", "components/*"]
};
