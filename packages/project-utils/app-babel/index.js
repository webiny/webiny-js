const appBabel = api => {
    api.cache(true);

    return {
        presets: ["babel-preset-react-app"],
        plugins: [
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