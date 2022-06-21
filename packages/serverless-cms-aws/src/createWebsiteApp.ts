import { PulumiAppParam, PulumiAppParamCallback } from "@webiny/pulumi";
import { createWebsitePulumiApp, CustomDomainParams } from "@webiny/pulumi-aws";
import { PluginCollection } from "@webiny/plugins/types";
import { uploadAppToS3, generateCommonHandlers, renderWebsite } from "./website/plugins";

export interface CreateWebsiteAppParams {
    /** Custom domain configuration */
    domain?: PulumiAppParamCallback<CustomDomainParams>;

    /**
     * Enables or disables VPC for the API.
     * For VPC to work you also have to enable it in the `core` application.
     */
    vpc?: PulumiAppParam<boolean | undefined>;

    /**
     * Provides a way to adjust existing Pulumi code (cloud infrastructure resources)
     * or add additional ones into the mix.
     */
    pulumi?: (app: ReturnType<typeof createWebsitePulumiApp>) => void;

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
