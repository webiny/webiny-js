module.exports = {
    ignore: {
        dependencies: ["@babel/runtime"],
        // devDependencies: ["@babel/cli", "@babel/core", "@babel/preset-env", "@babel/preset-flow"]
        devDependencies: true
    },
    dirs: [
        "independent/webiny-cli",
        "independent/webiny-app-cookie-policy",
        "independent/webiny-api-cookie-policy",
        "independent/webiny-app-google-tag-manager",
        "independent/webiny-api-google-tag-manager",
        "independent/webiny-app-mailchimp",
        "independent/webiny-api-mailchimp",
        "independent/webiny-app-typeform",
        "packages/demo-admin",
        "packages/demo-api",
        "packages/demo-site",
        "packages/webiny-data-extractor",
        "packages/webiny-validation",
        "packages/webiny-entity",
        "packages/webiny-entity-memory",
        "packages/webiny-entity-mongodb"
    ],
    ignoredDirs: ["/node_modules/"]
};
