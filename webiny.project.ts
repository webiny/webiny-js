/* We don't need the following rule in this file, as it's not being bundled with Webpack. */
/* eslint-disable import/dynamic-import-chunkname */
export default {
    name: "webiny-js",
    cli: {
        // No need to track anything when developing Webiny.
        telemetry: false,

        plugins: async () => {
            /**
             * In webiny-js repo, we need to handle cases when packages are not yet built.
             * Imports of those packages will fail, and it is ok to continue with process execution.
             */
            try {
                const modules = await Promise.allSettled([
                    import("@webiny/cli-plugin-workspaces"),
                    import("@webiny/cli-plugin-deploy-pulumi"),
                    import("@webiny/cwp-template-aws/cli"),
                    import("@webiny/cli-plugin-scaffold"),
                    import("@webiny/cli-plugin-extensions"),
                    import("@webiny/cli-plugin-scaffold-graphql-service"),
                    import("@webiny/cli-plugin-scaffold-admin-app-module"),
                    import("@webiny/cli-plugin-scaffold-extensions"),
                    import("@webiny/cli-plugin-scaffold-workspaces"),
                    import("@webiny/cli-plugin-scaffold-ci")
                ]);

                return modules
                    .map(m => {
                        // Use only "fulfilled" imports.
                        if (m.status === "fulfilled") {
                            try {
                                return typeof m.value.default === "function"
                                    ? m.value.default()
                                    : m.value.default;
                            } catch {
                                // This one is most likely not built yet.
                                return null;
                            }
                        }
                    })
                    .filter(Boolean);
            } catch (e) {
                // If the whole promise fails, act as if there are no plugins.
                return [];
            }
        }
    },
    appAliases: {
        core: "apps/core",
        api: "apps/api",
        admin: "apps/admin",
        website: "apps/website"
    },

    featureFlags: {
        experimentalAdminOmniSearch: true,
        newWatchCommand: true
    }
};
