import { loadJsonFileSync } from "load-json-file";

export default ({ path, esm }) => {
    return {
        presets: [
            [
                "@babel/preset-env",
                {
                    targets: {
                        node: "18"
                    },
                    modules: esm ? false : "auto",
                    exclude: [
                        "transform-typeof-symbol",
                        "@babel/plugin-proposal-optional-chaining",
                        "@babel/plugin-proposal-nullish-coalescing-operator",
                        "@babel/plugin-transform-async-to-generator",
                        "@babel/plugin-transform-regenerator",
                        "@babel/plugin-proposal-dynamic-import"
                    ]
                }
            ],
            "@babel/preset-typescript"
        ],
        plugins: [
            [
                "@babel/plugin-transform-runtime",
                {
                    useESModules: !!esm,
                    version: loadJsonFileSync(require.resolve("@babel/runtime/package.json"))
                        .version
                }
            ],
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
