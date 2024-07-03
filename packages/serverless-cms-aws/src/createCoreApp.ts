import { createCorePulumiApp, CreateCorePulumiAppParams } from "@webiny/pulumi-aws";
import { PluginCollection } from "@webiny/plugins/types";
import { generateDdbToEsHandler, checkEsServiceRole, checkOsServiceRole } from "./core/plugins";

export { CoreOutput, configureAdminCognitoFederation } from "@webiny/pulumi-aws";

export interface CreateCoreAppParams extends CreateCorePulumiAppParams {
    plugins?: PluginCollection;
}

export function createCoreApp(projectAppParams: CreateCoreAppParams = {}) {
    const builtInPlugins = [];
    if (projectAppParams.elasticSearch || projectAppParams.openSearch) {
        builtInPlugins.push(generateDdbToEsHandler);
        if (projectAppParams.elasticSearch) {
            builtInPlugins.push(checkEsServiceRole);
        } else {
            builtInPlugins.push(checkOsServiceRole);
        }
    }

    const customPlugins = projectAppParams.plugins ? [...projectAppParams.plugins] : [];

    return {
        id: "core",
        name: "Core",
        description: "Your project's stateful cloud infrastructure resources.",
        cli: {
            // Default args for the "yarn webiny watch ..." command (we don't need the deploy option while developing).
            watch: {
                // We disable local development for all AWS Lambda functions.
                // This can be changed down the line by passing another set of values
                // to the "watch" command (for example `-f ps-render-subscriber`).
                function: "none"
            }
        },
        pulumi: createCorePulumiApp(projectAppParams),
        plugins: [builtInPlugins, customPlugins],
    };
}
