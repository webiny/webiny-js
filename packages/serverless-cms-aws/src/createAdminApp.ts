import { PulumiAppParamCallback } from "@webiny/pulumi";
import { createAdminPulumiApp, CustomDomainParams } from "@webiny/pulumi-aws";
import * as plugins from "./admin/plugins";
import { PluginCollection } from "@webiny/plugins/types";

export interface CreateAdminAppParams {
    /** Custom domain configuration */
    domain?: PulumiAppParamCallback<CustomDomainParams>;

    /**
     * Provides a way to adjust existing Pulumi code (cloud infrastructure resources)
     * or add additional ones into the mix.
     */
    pulumi?: (app: ReturnType<typeof createAdminPulumiApp>) => void;

    plugins?: PluginCollection
}

export function createAdminApp(projectAppParams: CreateAdminAppParams = {}) {
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
        plugins: [plugins, projectAppParams.plugins]
    };
}
