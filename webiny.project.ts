// @ts-nocheck
const getStackOutput = require("@webiny/cli-plugin-deploy-pulumi/utils/getStackOutput");
const uploadFolderToS3 = require("@webiny/cli-plugin-deploy-pulumi/utils/aws/uploadFolderToS3");
const path = require("path");
const fs = require("fs");

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
                    import("@webiny/cli-plugin-scaffold-full-stack-app"),
                    import("@webiny/cli-plugin-scaffold-graphql-api"),
                    import("@webiny/cli-plugin-scaffold-graphql-service"),
                    import("@webiny/cli-plugin-scaffold-admin-app-module"),
                    import("@webiny/cli-plugin-scaffold-react-app"),
                    import("@webiny/cli-plugin-scaffold-react-component"),
                    import("@webiny/cli-plugin-scaffold-ci"),
                    import("./apps/admin/cli"),
                    import("./apps/website/cli")
                ]);

                return [
                    ...modules
                        .map(m => {
                            // Use only "fulfilled" imports.
                            if (m.status === "fulfilled") {
                                try {
                                    if (typeof m.value.default === "function") {
                                        return m.value.default();
                                    }
                                    return m.value.default;
                                } catch {
                                    // This one is most likely not built yet.
                                    return null;
                                }
                            }
                        })
                        .filter(Boolean),
                    {
                        type: "hook-after-deploy",
                        name: "hook-after-deploy-admin-upload",
                        async hook(args, context) {
                            if (args.projectApplication.id !== "admin") {
                                return;
                            }

                            /* if (args.inputs.build === false) {
                                context.info(
                                    `"--no-build" argument detected - skipping React application upload and prerendering.`
                                );
                                return;
                            }*/

                            context.info("Uploading React application...");
                            // 1. Get exports from `site` stack, for `args.env` environment.
                            const adminOutput = getStackOutput({
                                folder: "apps/admin",
                                env: args.env
                            });

                            let webContentsRootPath = path.join(
                                process.cwd(),
                                "apps",
                                "admin",
                                "code",
                                "build"
                            );

                            if (!fs.existsSync(webContentsRootPath)) {
                                webContentsRootPath = path.join(
                                    process.cwd(),
                                    "apps",
                                    "site",
                                    "code",
                                    "build"
                                );
                            }

                            if (!fs.existsSync(webContentsRootPath)) {
                                throw new Error("Cannot continue, build folder not found.");
                            }

                            const start = new Date();
                            const getDuration = () => {
                                return (new Date() - start) / 1000;
                            };

                            await uploadFolderToS3({
                                path: webContentsRootPath,
                                bucket: adminOutput.appStorage,
                                onFileUploadSuccess: ({ paths }) => {
                                    context.success(paths.relative);
                                },
                                onFileUploadError: ({ paths, error }) => {
                                    context.error(
                                        "Failed to upload " + context.error.hl(paths.relative)
                                    );
                                    console.log(error);
                                }
                            });

                            context.success(
                                `React application successfully uploaded in ${context.success.hl(
                                    getDuration()
                                )}s.`
                            );
                        }
                    }
                ];
            } catch (e) {
                // If the whole promise fails, act as if there are no plugins.
                return [];
            }
        }
    }
};
