export default ({ path }) => {
    return {
        presets: [
            ["@babel/preset-react", { useBuiltIns: true }],
            ["@babel/preset-typescript", { isTSX: true, allExtensions: true }]
        ],
        plugins: [
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
