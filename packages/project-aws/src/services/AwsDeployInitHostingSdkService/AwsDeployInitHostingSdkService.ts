import { createImplementation } from "@webiny/di";
import { InitHostingSdkService } from "@webiny/project/abstractions/index.js";
import { registerSrcExtensions } from "@webiny/project/utils/index.js";
import { deployHooks } from "@webiny/project-extensions-aws/extensions/hooks/deployHooks.js";
import { deployAppClearWatchedLambdaFunctions } from "~/decorators/DeployAppClearWatchedLambdaFunctions.js";
import { deployAppRefreshStackOutputCache } from "~/decorators/DeployAppRefreshStackOutputCache.js";
import { deployAppWithHooks } from "~/decorators/DeployAppWithHooks.js";
import { deployAppWithWatchedLambdaReplacement } from "~/decorators/DeployAppWithWatchedLambdaReplacement.js";
import { destroyAppClearStackOutputCache } from "~/decorators/DestroyAppClearStackOutputCache.js";
import { getPulumiServiceWithDownloadInfo } from "~/decorators/GetPulumiServiceWithDownloadInfo.js";

/**
 * The CLI side of deploying: the deploy hooks the project config names, and the decorators around
 * deploy, destroy and the Pulumi CLI download. Registered here, and only here, because the
 * container doesn't de-duplicate decorators: registering one twice wraps twice.
 */
export class AwsDeployInitHostingSdkService implements InitHostingSdkService.Interface {
    async execute({ container, projectExtensions, project }: InitHostingSdkService.Params) {
        const hookExtensions = deployHooks.flatMap(hook =>
            projectExtensions.extensionsByType(hook)
        );

        await registerSrcExtensions(container, hookExtensions, project);

        container.registerDecorator(deployAppWithWatchedLambdaReplacement);
        container.registerDecorator(deployAppClearWatchedLambdaFunctions);
        container.registerDecorator(deployAppRefreshStackOutputCache);
        container.registerDecorator(destroyAppClearStackOutputCache);
        container.registerDecorator(deployAppWithHooks);
        container.registerDecorator(getPulumiServiceWithDownloadInfo);
    }
}

export const awsDeployInitHostingSdkService = createImplementation({
    abstraction: InitHostingSdkService,
    implementation: AwsDeployInitHostingSdkService,
    dependencies: []
});
