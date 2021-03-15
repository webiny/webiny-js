module.exports = ({ path }) => ({
    presets: [
        [
            "@babel/preset-env",
            {
                targets: {
                    browsers: ["last 2 versions", "safari >= 7"]
                },
                // Allow importing core-js in entrypoint and use browserlist to select polyfills
                useBuiltIns: "entry",
                // Set the corejs version we are using to avoid warnings in console
                // This will need to change once we upgrade to corejs@3
                corejs: 3,
                // Do not transform modules to CJS
                modules: false,
                // Exclude transforms that make all code slower
                exclude: ["transform-typeof-symbol"]
            }
        ],
        ["@babel/preset-react", { useBuiltIns: true }],
        ["@babel/preset-typescript", { isTSX: true, allExtensions: true }]
    ],
    plugins: [
        "babel-plugin-macros",
        "babel-plugin-lodash",
        "@babel/plugin-proposal-class-properties",
        "@babel/plugin-proposal-throw-expressions",
        [
            "@babel/plugin-transform-runtime",
            {
                corejs: false,
                version: require("@babel/runtime/package.json").version,
                regenerator: true,
                useESModules: false
            }
        ],
        "@babel/plugin-proposal-optional-chaining",
        "@babel/plugin-proposal-nullish-coalescing-operator",
        ["babel-plugin-emotion", { autoLabel: true }],
        [
            "@babel/plugin-proposal-object-rest-spread",
            {
                useBuiltIns: true
            }
        ],
        [
            "babel-plugin-named-asset-import",
            {
                loaderMap: {
                    svg: {
                        ReactComponent: "@svgr/webpack![path]"
                    }
                }
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
});
