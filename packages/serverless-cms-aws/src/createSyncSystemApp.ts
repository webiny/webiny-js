import type { CreateSyncSystemPulumiAppParams } from "@webiny/pulumi-aws/apps/syncSystem/createSyncSystemPulumiApp.js";
import { createSyncSystemPulumiApp } from "@webiny/pulumi-aws/apps/syncSystem/createSyncSystemPulumiApp.js";
import type { PluginCollection } from "@webiny/plugins/types";

export interface CreateSyncSystemAppParams extends CreateSyncSystemPulumiAppParams {
    plugins?: PluginCollection;
}

export function createSyncSystemApp(projectAppParams: CreateSyncSystemAppParams) {
    const plugins = projectAppParams.plugins ? [...projectAppParams.plugins] : [];

    return {
        id: "sync",
        name: "Sync System",
        description: "Your project's Sync System.",
        cli: {
            // Default args for the "yarn webiny watch ..." command (we don't need the deploy option while developing).
            watch: {
                // We disable local development for all AWS Lambda functions.
                // This can be changed down the line by passing another set of values
                // to the "watch" command (for example `-f ps-render-subscriber`).
                function: "none"
            }
        },
        pulumi: createSyncSystemPulumiApp(projectAppParams),
        plugins: plugins.concat([])
    };
}
