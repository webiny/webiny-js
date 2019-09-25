module.exports = {
    ignore: {
        dependencies: ["@babel/runtime"],
        // devDependencies: ["@babel/cli", "@babel/core", "@babel/preset-env", "@babel/preset-flow"]
        devDependencies: true
    },
    dirs: [
        "packages/cli",
        "packages/app-cookie-policy",
        "packages/api-cookie-policy",
        "packages/app-google-tag-manager",
        "packages/api-google-tag-manager",
        "packages/app-mailchimp",
        "packages/api-mailchimp",
        "packages/app-typeform",
        "packages/app-cms",
        "packages/app-admin",
        "packages/ui",
        "packages/validation",
    ],
    ignoredDirs: ["/node_modules/"]
};
