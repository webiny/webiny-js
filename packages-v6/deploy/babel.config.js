const sharedPresets = ["@babel/typescript"];
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
                    "@babel/env",
                    {
                        modules: "commonjs"
                    }
                ],
                ...sharedPresets
            ],
            plugins: [["@babel/plugin-transform-runtime", { useESModules: false }]]
        }
    }
};
