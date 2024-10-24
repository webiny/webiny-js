import { createAdminPulumiApp, CreateAdminPulumiAppParams } from "@webiny/pulumi-aws/enterprise";
import { uploadAppToS3 } from "~/react/plugins";
import { PluginCollection } from "@webiny/plugins/types";
import { ensureApiDeployedBeforeBuild } from "~/website/plugins";

export interface CreateAdminAppParams extends CreateAdminPulumiAppParams {
    plugins?: PluginCollection;
}

export function createAdminApp(projectAppParams: CreateAdminAppParams = {}) {
    const builtInPlugins = [uploadAppToS3({ folder: "apps/admin" }), ensureApiDeployedBeforeBuild];

    const customPlugins = projectAppParams.plugins ? [...projectAppParams.plugins] : [];

    return {
        id: "admin",
        name: "Admin",
        description: "Your project's admin area§.",
        cli: {
            // Default args for the "yarn webiny watch ..." command (we don't need deploy option while developing).
            watch: {
                deploy: false
            }
        },
        pulumi: createAdminPulumiApp(projectAppParams),
        plugins: [builtInPlugins, customPlugins]
    };
}
