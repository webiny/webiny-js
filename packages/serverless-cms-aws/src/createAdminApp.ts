import { createAdminPulumiApp, CreateAdminPulumiAppParams } from "@webiny/pulumi-aws";
import { uploadAppToS3 } from "./react/plugins";
import { PluginCollection } from "@webiny/plugins/types";
import { createEnsureApiDeployedPlugins } from "~/utils/ensureApiDeployed";

export interface CreateAdminAppParams extends CreateAdminPulumiAppParams {
    plugins?: PluginCollection;
}

interface CreateAdminAppResult {
    id: string;
    name: string;
    description: string;
    cli: {
        watch: {
            deploy: boolean;
        };
    };
    pulumi: ReturnType<typeof createAdminPulumiApp>;
    plugins: PluginCollection;
}

export function createAdminApp(projectAppParams: CreateAdminAppParams = {}): CreateAdminAppResult {
    const builtInPlugins = [
        uploadAppToS3({ folder: "apps/admin" }),
        ...createEnsureApiDeployedPlugins("admin")
    ];

    const customPlugins = projectAppParams.plugins ? [...projectAppParams.plugins] : [];

    return {
        id: "admin",
        name: "Admin",
        description: "Your project's admin area.",
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
