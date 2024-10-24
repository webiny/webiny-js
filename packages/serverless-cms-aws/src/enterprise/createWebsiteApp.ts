import {
    createWebsitePulumiApp,
    CreateWebsitePulumiAppParams
} from "@webiny/pulumi-aws/enterprise";
import { PluginCollection } from "@webiny/plugins/types";
import {
    generateCommonHandlers,
    lambdaEdgeWarning,
    renderWebsite,
    telemetryNoLongerNewUser,
    ensureApiDeployedBeforeBuild
} from "~/website/plugins";
import { uploadAppToS3 } from "~/react/plugins";

export interface CreateWebsiteAppParams extends CreateWebsitePulumiAppParams {
    plugins?: PluginCollection;
}

export function createWebsiteApp(projectAppParams: CreateWebsiteAppParams = {}) {
    const builtInPlugins = [
        uploadAppToS3({ folder: "apps/website" }),
        generateCommonHandlers,
        lambdaEdgeWarning,
        renderWebsite,
        telemetryNoLongerNewUser,
        ensureApiDeployedBeforeBuild
    ];

    const customPlugins = projectAppParams.plugins ? [...projectAppParams.plugins] : [];

    return {
        id: "website",
        name: "Website",
        description: "Your project's public website.",
        cli: {
            // Default args for the "yarn webiny watch ..." command (we don't need the deploy option while developing).
            watch: {
                // We disable local development for all AWS Lambda functions.
                // This can be changed down the line by passing another set of values
                // to the "watch" command (for example `-f ps-render-subscriber`).
                function: "none",

                // We can remove this once the new watch command is released.
                deploy: false
            }
        },
        pulumi: createWebsitePulumiApp(projectAppParams),
        plugins: [builtInPlugins, customPlugins]
    };
}
