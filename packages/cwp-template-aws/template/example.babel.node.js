module.exports = ({ path }) => ({
    presets: [
        [
            "@babel/preset-env",
            {
                targets: {
                    node: "12"
                }
            }
        ],
        "@babel/preset-typescript"
    ],
    plugins: [
        ["@babel/plugin-proposal-class-properties"],
        ["@babel/plugin-proposal-object-rest-spread", { useBuiltIns: true }],
        ["@babel/plugin-transform-runtime", { useESModules: false }],
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
});
