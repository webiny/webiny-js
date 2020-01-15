const appBabel = api => {
    const isDevelopment = api.env("development");

    return {
        presets: ["babel-preset-react-app"],
        plugins: [
            isDevelopment && ["react-hot-loader/babel"],
            ["babel-plugin-emotion", { autoLabel: true }],
            ["babel-plugin-lodash", { id: ["lodash"] }]
        ].filter(Boolean)
    };
};

module.exports = (customizer = null) => {
    if (typeof customizer === "function") {
        return api => customizer(api)(appBabel(api));
    }

    return appBabel;
};