module.exports = ({ path }) => ({
    presets: [
        ["@babel/preset-react", { useBuiltIns: true }],
        ["@babel/preset-typescript", { isTSX: true, allExtensions: true }]
    ],
    plugins: [
        "babel-plugin-macros",
        "@babel/plugin-proposal-throw-expressions",
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
