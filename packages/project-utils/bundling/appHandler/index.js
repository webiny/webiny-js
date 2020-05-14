module.exports.buildAppHandler = options => {
    return require("./executor")({ ...options, ssr: false });
};

module.exports.buildAppHandlerWithSSR = options => {
    return require("./executor")({ ...options, ssr: true });
};
