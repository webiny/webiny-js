module.exports =
    process.env.BUILD_TYPE === "api" ? require("./.babelrc.api") : require("./.babelrc.client");
