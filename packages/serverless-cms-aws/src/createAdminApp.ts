import { PulumiAppParamCallback } from "@webiny/pulumi";
import { createAdminPulumiApp, CustomDomainParams } from "@webiny/pulumi-aws";
import { uploadAppToS3 } from "./admin/plugins";
import { PluginCollection } from "@webiny/plugins/types";

export interface CreateAdminAppParams {
    /** Custom domain configuration */
    domain?: PulumiAppParamCallback<CustomDomainParams>;

    /**
     * Provides a way to adjust existing Pulumi code (cloud infrastructure resources)
     * or add additional ones into the mix.
     */
    pulumi?: (app: ReturnType<typeof createAdminPulumiApp>) => void;

    plugins?: PluginCollection;
}

export function createAdminApp(projectAppParams: CreateAdminAppParams = {}) {
    const builtInPlugins = [uploadAppToS3];
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
