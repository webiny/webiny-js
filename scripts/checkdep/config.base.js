module.exports = {
    ignore: {
        dependencies: ["@babel/runtime"],
        // devDependencies: ["@babel/cli", "@babel/core", "@babel/preset-env", "@babel/preset-flow"]
        devDependencies: true
    },
    dirs: [
        "independent/webiny-cli",
        "independent/webiny-integration-cookie-policy",
        "independent/webiny-integration-google-tag-manager",
        "independent/webiny-integration-mailchimp",
        "independent/webiny-integration-typeform",

        "packages/demo-admin",
        "packages/demo-api",
        "packages/demo-site",
        "packages/webiny-data-extractor",
        "packages/webiny-validation"
    ],
    ignoredDirs: ["/node_modules/"]
};
