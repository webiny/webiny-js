try {
    module.exports = {
        name: "webiny-js",
        cli: {
            plugins: [
                require("@webiny/cli-plugin-workspaces")(),
                require("@webiny/cli-plugin-deploy-pulumi")(),
                require("@webiny/api-page-builder/cli")(),
                require("@webiny/cwp-template-aws/cli")(),
                require("@webiny/cli-plugin-scaffold").default(),
                require("@webiny/cli-plugin-scaffold-graphql-service").default(),
                require("@webiny/cli-plugin-scaffold-admin-app-module").default(),
                require("@webiny/cli-plugin-scaffold-react-component").default()
            ]
        }
    };
} catch {
    // This try / catch is not needed in real projects, only for "webiny-js" repository.
    // This is because packages are built using "yarn webiny run build" command, which
    // invoke the Webiny CLI, and which requires this file. As we can see, above we have
    // requires of allegedly built packages, but on the first build, that's not true.

    // In summary, an error will be thrown on the very first build of the repository. After
    // that, it's fine, because packages were built and will be required successfully.
}
