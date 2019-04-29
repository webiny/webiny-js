module.exports = {
    ignore: {
        dependencies: ["@babel/runtime"],
        // devDependencies: ["@babel/cli", "@babel/core", "@babel/preset-env", "@babel/preset-flow"]
        devDependencies: true
    },
    dirs: [
        "packages/webiny-cli",
        "packages/webiny-app-cookie-policy",
        "packages/webiny-api-cookie-policy",
        "packages/webiny-app-google-tag-manager",
        "packages/webiny-api-google-tag-manager",
        "packages/webiny-app-mailchimp",
        "packages/webiny-api-mailchimp",
        "packages/webiny-app-typeform",
        "packages/demo-admin",
        "packages/demo-api",
        "packages/demo-site",
        "packages/webiny-data-extractor",
        "packages/webiny-validation",
        "packages/webiny-entity",
        "packages/webiny-entity-mongodb"
    ],
    ignoredDirs: ["/node_modules/"]
};
