// TODO: waiting for this to be released: https://github.com/facebook/jest/pull/8894/files
// Until then, specify the packages manually

module.exports = {
    projects: [
        "packages/api-headless-cms",
        "packages/api-files",
        "packages/api-security",
        "packages/plugins",
        "packages/validation",
        "packages/http-handler-ssr",
        "packages/http-handler-apollo-gateway",
        "packages/http-handler-apollo-server"
    ],
    modulePathIgnorePatterns: ["dist"]
};
