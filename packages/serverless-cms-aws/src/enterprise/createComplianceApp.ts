import {
    createCompliancePulumiApp,
    CreateCompliancePulumiAppParams
} from "@webiny/pulumi-aws/enterprise";
import { PluginCollection } from "@webiny/plugins/types";

export interface CreateComplianceAppParams extends CreateCompliancePulumiAppParams {
    plugins?: PluginCollection;
}

export function createComplianceApp(projectAppParams: CreateComplianceAppParams = {}) {
    const customPlugins = projectAppParams.plugins ? [...projectAppParams.plugins] : [];

    return {
        id: "compliance",
        name: "Compliance",
        description: "Your project's stateful cloud infrastructure resources.",
        pulumi: createCompliancePulumiApp(projectAppParams),
        plugins: [customPlugins]
    };
}
