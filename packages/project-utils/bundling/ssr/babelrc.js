// This file is used for SSR build only!
module.exports = {
    presets: [
        [
            "@babel/preset-env",
            {
                targets: {
                    node: "10.14"
                },
                // Do not transform modules to CJS
                modules: false,
                // Exclude transforms that make all code slower
                exclude: ["transform-typeof-symbol"]
            }
        ],
        ["@babel/preset-react", { useBuiltIns: true }]
    ],
    plugins: ["babel-plugin-lodash"]
};
