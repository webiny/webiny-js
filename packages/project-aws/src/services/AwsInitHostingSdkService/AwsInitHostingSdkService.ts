import { createImplementation } from "@webiny/di";
import { InitHostingSdkService } from "@webiny/project/abstractions/index.js";
import { traceAsync } from "@webiny/project/utils/trace/index.js";
import { deployAppClearWatchedLambdaFunctions } from "~/decorators/DeployAppClearWatchedLambdaFunctions.js";
import { deployAppRefreshStackOutputCache } from "~/decorators/DeployAppRefreshStackOutputCache.js";
import { deployAppWithHooks } from "~/decorators/DeployAppWithHooks.js";
import { deployAppWithWatchedLambdaReplacement } from "~/decorators/DeployAppWithWatchedLambdaReplacement.js";
import { destroyAppClearStackOutputCache } from "~/decorators/DestroyAppClearStackOutputCache.js";
import { getPulumiServiceWithDownloadInfo } from "~/decorators/GetPulumiServiceWithDownloadInfo.js";
import { registerDeployHooks } from "./registerDeployHooks.js";
import { registerPulumiExtensions } from "./registerPulumiExtensions.js";

/**
 * The AWS part of initializing the project SDK: the deploy hooks and Pulumi programs named in the
 * project config, and the decorators that wrap deploy, destroy and the Pulumi CLI download.
 */
export class AwsInitHostingSdkService implements InitHostingSdkService.Interface {
    async execute({ container, projectExtensions, project }: InitHostingSdkService.Params) {
        await traceAsync("register deploy hooks", () => {
            return registerDeployHooks(container, projectExtensions, project);
        });

        await traceAsync("register Pulumi extensions", () => {
            return registerPulumiExtensions(container, projectExtensions, project);
        });

        container.registerDecorator(deployAppWithWatchedLambdaReplacement);
        container.registerDecorator(deployAppClearWatchedLambdaFunctions);
        container.registerDecorator(deployAppRefreshStackOutputCache);
        container.registerDecorator(destroyAppClearStackOutputCache);
        container.registerDecorator(deployAppWithHooks);
        container.registerDecorator(getPulumiServiceWithDownloadInfo);
    }
}

export const awsInitHostingSdkService = createImplementation({
    abstraction: InitHostingSdkService,
    implementation: AwsInitHostingSdkService,
    dependencies: []
});
