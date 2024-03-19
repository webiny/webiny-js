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
                    import(
                        /* webpackChunkName: "webinyCliPluginWorkspaces" */
                        "@webiny/cli-plugin-workspaces"
                    ),
                    import(
                        /* webpackChunkName: "webinyCliPluginDeployPulumi" */
                        "@webiny/cli-plugin-deploy-pulumi"
                    ),
                    import(
                        /* webpackChunkName: "webinyCwpTemplateAwsCli" */
                        "@webiny/cwp-template-aws/cli"
                    ),
                    import(
                        /* webpackChunkName: "webinyCliPluginScaffold" */ "@webiny/cli-plugin-scaffold"
                    ),
                    import(
                        /* webpackChunkName: "webinyCliPluginScaffoldGraphQlService" */ "@webiny/cli-plugin-scaffold-graphql-service"
                    ),
                    import(
                        /* webpackChunkName: "webinyCliPluginScaffoldAdminAppModule" */ "@webiny/cli-plugin-scaffold-admin-app-module"
                    ),
                    import(
                        /* webpackChunkName: "webinyCliPluginScaffoldCi" */ "@webiny/cli-plugin-scaffold-ci"
                    )
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
        copyPermissionsButton: true,
        experimentalAdminOmniSearch: true
    }
};
