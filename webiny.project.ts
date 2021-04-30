export default {
    name: "webiny-js",
    cli: {
        plugins: async () => {
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
