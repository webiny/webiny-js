module.exports = {
    presets: [
        [
            require.resolve("@babel/preset-env", { paths: [__dirname] }),
            {
                targets: {
                    node: "18"
                }
            }
        ],
        require.resolve("@babel/preset-typescript", { paths: [__dirname] })
    ],
    plugins: [require.resolve("@babel/plugin-proposal-class-properties", { paths: [__dirname] })]
};
