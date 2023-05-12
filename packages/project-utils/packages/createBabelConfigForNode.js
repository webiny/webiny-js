/**
 * This is override for https://github.com/lodash/babel-plugin-lodash/issues/259.
 * babel-plugin-lodash is using deprecated babel API, which causes generation of many
 * console.trace calls.
 */
const consoleTrace = console.trace.bind(console);
console.trace = (message, ...optionalParams) => {
    if (
        typeof message === "string" &&
        message.startsWith("`isModuleDeclaration` has been deprecated")
    ) {
        return undefined; // noop
    }

    return consoleTrace(message, ...optionalParams);
};
/**
 *
 */
module.exports = ({ path, esm }) => {
    return {
        presets: [
            [
                "@babel/preset-env",
                {
                    targets: {
                        node: "16"
                    },
                    modules: esm ? false : "auto"
                }
            ],
            "@babel/preset-typescript"
        ],
        plugins: [
            ["@babel/plugin-proposal-class-properties"],
            ["@babel/plugin-proposal-object-rest-spread", { useBuiltIns: true }],
            [
                "@babel/plugin-transform-runtime",
                {
                    useESModules: !!esm,
                    version: require("@babel/runtime/package.json").version
                }
            ],
            ["babel-plugin-dynamic-import-node"],
            ["babel-plugin-lodash"],
            [
                "babel-plugin-module-resolver",
                {
                    cwd: path,
                    alias: {
                        "~": "./src"
                    }
                }
            ]
        ]
    };
};
