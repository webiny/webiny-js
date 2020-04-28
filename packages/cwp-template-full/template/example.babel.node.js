const babel = {
    presets: [
        [
            "@babel/preset-env",
            {
                targets: {
                    node: "8.10"
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
        ["babel-plugin-lodash"]
    ].filter(Boolean)
};

module.exports = babel;
