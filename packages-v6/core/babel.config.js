const sharedPresets = [require.resolve("@babel/preset-typescript")];
const shared = {
    presets: sharedPresets
};

module.exports = {
    env: {
        esm: shared,
        cjs: {
            ...shared,
            presets: [
                [
                    require.resolve("@babel/preset-env"),
                    {
                        modules: "commonjs"
                    }
                ],
                ...sharedPresets
            ],
            plugins: [[require.resolve("@babel/plugin-transform-runtime"), { useESModules: false }]]
        }
    }
};
