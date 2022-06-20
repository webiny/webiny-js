import { PulumiAppParam, PulumiAppParamCallback } from "@webiny/pulumi";
import { createApiPulumiApp, CustomDomainParams } from "@webiny/pulumi-aws";
import { PluginCollection } from "@webiny/plugins/types";
import plugins from "./api/plugins";

export interface CreateApiAppParams {
    /**
     * Enables or disables VPC for the API.
     * For VPC to work you also have to enable it in the Core application.
     */
    vpc?: PulumiAppParam<boolean>;

    /** Custom domain configuration */
    domain?: PulumiAppParamCallback<CustomDomainParams>;

    /**
     * Provides a way to adjust existing Pulumi code (cloud infrastructure resources)
     * or add additional ones into the mix.
     */
    pulumi?: (app: ReturnType<typeof createApiPulumiApp>) => void;

    plugins?: PluginCollection;
}

export function createApiApp(projectAppParams: CreateApiAppParams = {}) {
    return {
        id: "api",
        name: "API",
        description:
            "Represents cloud infrastructure needed for supporting your project's (GraphQL) API.",
        cli: {
            // Default args for the "yarn webiny watch ..." command.
            watch: {
                // Watch five levels of dependencies, starting from this project application.
                depth: 5
            }
        },
        pulumi: createApiPulumiApp(projectAppParams),

        plugins: [...plugins, projectAppParams.plugins ? [...projectAppParams.plugins] : []]
    };
}
