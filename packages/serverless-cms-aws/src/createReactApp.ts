import { createReactPulumiApp, CreateReactPulumiAppParams } from "@webiny/pulumi-aws";
import { uploadAppToS3 } from "./react/plugins";
import { PluginCollection } from "@webiny/plugins/types";

export interface CreateReactAppParams extends CreateReactPulumiAppParams {
    plugins?: PluginCollection;
}

interface CreateReactAppResult {
    id: string;
    name: string;
    cli: {
        watch: {
            deploy: boolean;
        };
    };
    pulumi: ReturnType<typeof createReactPulumiApp>;
    plugins: PluginCollection;
}

export function createReactApp(projectAppParams: CreateReactAppParams): CreateReactAppResult {
    const builtInPlugins = [uploadAppToS3({ folder: projectAppParams.folder })];
    const customPlugins = projectAppParams.plugins ? [...projectAppParams.plugins] : [];

    return {
        id: projectAppParams.name,
        name: projectAppParams.name,
        cli: {
            // Default args for the "yarn webiny watch ..." command (we don't need a "deploy" option while developing).
            watch: {
                deploy: false
            }
        },
        pulumi: createReactPulumiApp(projectAppParams),
        plugins: [builtInPlugins, customPlugins]
    };
}
