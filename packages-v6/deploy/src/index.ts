import { useContext, ProjectDeployConfig } from "@webiny/cli";
import { createGenericApplication, ResourceHandler } from "@webiny/pulumi-sdk-v6";
import { login } from "./utils/login";
import { getPulumi } from "./utils/getPulumi";
import { createAPIApplication } from "./application";
import { tagResources as tagPulumiResources } from "./tagResources";

interface DeployApiOptions {
    preview?: boolean;
}

export default async ({ preview }: DeployApiOptions) => {
    const context = await useContext();
    await login("api");

    const pulumi = await getPulumi();

    const config = context.getConfig();

    // `deploy` can't be executed without an `--env` flag, so we know it is set.
    const env = context.getEnv()!;
    const deployConfig: ProjectDeployConfig = config.deploy ? config.deploy(env) : {};

    const onResource: ResourceHandler = resource => {
        if (typeof deployConfig.resourceName === "function") {
            resource.name = deployConfig.resourceName(resource.name);
        }
    };

    const tagResources = () => tagPulumiResources(deployConfig.resourceTags || {});

    const api = createAPIApplication({ onResource, tagResources });

    const pulumiPlugins = context.getPlugins().filter(pl => pl.pulumi !== undefined);
    for (const plugin of pulumiPlugins) {
        const applyPulumiConfig = await import(plugin.pulumi!).then(m =>
            m.default(plugin.__options)
        );

        await applyPulumiConfig({ api });
    }

    const pulumiApp = createGenericApplication({
        id: "api",
        name: "API",
        app: api
    });

    const stack = await pulumiApp.createOrSelectStack({
        root: context.resolve(),
        env: context.getEnv()!,
        pulumi
    });

    if (preview) {
        await stack.preview();
    } else {
        await stack.up();
    }
};

export type APIPulumiApplication = Record<string, unknown>;
