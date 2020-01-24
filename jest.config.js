// TODO: waiting for this to be released: https://github.com/facebook/jest/pull/8894/files
// Until then, specify the packages manually

module.exports = {
    projects: [
        "packages/api-files",
        "packages/plugins",
        "packages/validation",
        "packages/http-handler-ssr"
    ],
    modulePathIgnorePatterns: ["dist"]
};
