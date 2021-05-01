export default {
    name: "webiny-js",
    cli: {
        plugins: async () => {
            /**
             * In webiny-js repo, we need to handle cases when packages are not yet built.
             * Imports of those packages will fail, and we need to handle it gracefully.
             * Using `Promise.allSettled` we get all promises back, and can filter based on the 
             * their status. Even if all imports fail, it is ok to continue with process execution.
             */
            const modules = await Promise.allSettled([
                import("@webiny/cli-plugin-workspaces"),
                import("@webiny/cli-plugin-deploy-pulumi"),
                import("@webiny/api-page-builder/cli"),
                import("@webiny/cwp-template-aws/cli"),
                import("@webiny/cli-plugin-scaffold"),
                import("@webiny/cli-plugin-scaffold-graphql-service"),
                import("@webiny/cli-plugin-scaffold-admin-app-module"),
                import("@webiny/cli-plugin-scaffold-react-component")
            ]);

            return (
                modules
                    // Filter out rejected promises
                    .filter(p => p.status === "fulfilled")
                    // Get values of fulfilled promises
                    .map((p: PromiseFulfilledResult<any>) => p.value)
                    // Run plugin factories
                    .map(m => m.default())
            );
        }
    }
};
