import { createWebsitePulumiApp, CreateWebsitePulumiAppParams } from "@webiny/pulumi-aws";
import { PluginCollection } from "@webiny/plugins/types";
import { uploadAppToS3, generateCommonHandlers, renderWebsite } from "./website/plugins";

export interface CreateWebsiteAppParams extends CreateWebsitePulumiAppParams {
    plugins?: PluginCollection;
}

export function createWebsiteApp(projectAppParams: CreateWebsiteAppParams = {}) {
    const builtInPlugins = [uploadAppToS3, generateCommonHandlers, renderWebsite];
    const customPlugins = projectAppParams.plugins ? [...projectAppParams.plugins] : [];

    return {
        id: "website",
        name: "Website",
        description: "Your project's public website.",
        cli: {
            // Default args for the "yarn webiny watch ..." command (we don't need deploy option while developing).
            watch: {
                deploy: false
            }
        },
        pulumi: createWebsitePulumiApp(projectAppParams),
        plugins: [builtInPlugins, customPlugins]
    };
}
