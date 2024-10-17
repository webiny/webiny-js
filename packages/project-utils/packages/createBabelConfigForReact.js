module.exports = ({ path, esm }) => ({
    presets: [
        [
            "@babel/preset-env",
            {
                targets: {
                    browsers: ["last 2 versions"]
                },
                // Allow importing core-js in entrypoint and use browserlist to select polyfills
                useBuiltIns: "entry",
                // Set the corejs version we are using to avoid warnings in console
                // This will need to change once we upgrade to corejs@3
                corejs: 3,
                // Do not transform modules to CJS
                modules: esm ? false : "auto",
                // Exclude transforms that make all code slower
                exclude: [
                    "transform-typeof-symbol",
                    "@babel/plugin-proposal-optional-chaining",
                    "@babel/plugin-proposal-nullish-coalescing-operator",
                    "@babel/plugin-transform-async-to-generator",
                    "@babel/plugin-transform-regenerator"
                ]
            }
        ],
        ["@babel/preset-react", { useBuiltIns: true }],
        ["@babel/preset-typescript", { isTSX: true, allExtensions: true }]
    ],
    plugins: [
        "babel-plugin-macros",
        [
            "@babel/plugin-transform-runtime",
            {
                corejs: false,
                version: require("@babel/runtime/package.json").version,
                regenerator: true,
                useESModules: false
            }
        ],
        ["@emotion/babel-plugin", { autoLabel: "dev-only" }],
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
});
