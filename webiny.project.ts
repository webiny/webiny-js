// @ts-nocheck
export default {
    name: "webiny-js",
    cli: {
        plugins: async () => {
            /**
             * In webiny-js repo, we need to handle cases when packages are not yet built.
             * Imports of those packages will fail, and it is ok to continue with process execution.
             */
            try {
                const modules = await Promise.all([
                    import("@webiny/cli-plugin-workspaces"),
                    import("@webiny/cli-plugin-deploy-pulumi"),
                    import("@webiny/api-page-builder/cli"),
                    import("@webiny/cwp-template-aws/cli"),
                    import("@webiny/cli-plugin-scaffold"),
                    import("@webiny/cli-plugin-scaffold-graphql-service"),
                    import("@webiny/cli-plugin-scaffold-admin-app-module"),
                    import("@webiny/cli-plugin-scaffold-react-component")
                ]);

                return modules.map(m => m.default());
            } catch (e) {
                return [];
            }
        }
    }
};
