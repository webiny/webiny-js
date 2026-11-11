import { createImplementation } from "@webiny/di";
import { InitHostingSdkService } from "@webiny/project/abstractions/index.js";
import { registerSrcExtensions } from "@webiny/project/utils/index.js";
import { AdminAfterDeploy } from "@webiny/project-extensions-aws/extensions/hooks/AdminAfterDeploy.js";
import { AdminBeforeDeploy } from "@webiny/project-extensions-aws/extensions/hooks/AdminBeforeDeploy.js";
import { AfterDeploy } from "@webiny/project-extensions-aws/extensions/hooks/AfterDeploy.js";
import { ApiAfterDeploy } from "@webiny/project-extensions-aws/extensions/hooks/ApiAfterDeploy.js";
import { ApiBeforeDeploy } from "@webiny/project-extensions-aws/extensions/hooks/ApiBeforeDeploy.js";
import { BeforeDeploy } from "@webiny/project-extensions-aws/extensions/hooks/BeforeDeploy.js";
import { CoreAfterDeploy } from "@webiny/project-extensions-aws/extensions/hooks/CoreAfterDeploy.js";
import { CoreBeforeDeploy } from "@webiny/project-extensions-aws/extensions/hooks/CoreBeforeDeploy.js";
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
        const hookExtensions = [
            ...projectExtensions.extensionsByType(BeforeDeploy),
            ...projectExtensions.extensionsByType(AfterDeploy),
            ...projectExtensions.extensionsByType(AdminBeforeDeploy),
            ...projectExtensions.extensionsByType(AdminAfterDeploy),
            ...projectExtensions.extensionsByType(ApiBeforeDeploy),
            ...projectExtensions.extensionsByType(ApiAfterDeploy),
            ...projectExtensions.extensionsByType(CoreBeforeDeploy),
            ...projectExtensions.extensionsByType(CoreAfterDeploy)
        ];

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
