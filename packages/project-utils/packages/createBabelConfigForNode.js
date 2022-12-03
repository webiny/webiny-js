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
