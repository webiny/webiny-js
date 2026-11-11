import { Container } from "@webiny/di";

// Features
import { deployApp } from "~/features/DeployApp/DeployApp.js";
import { destroyApp } from "~/features/DestroyApp/DestroyApp.js";
import { exportStack } from "~/features/ExportStack/ExportStack.js";
import { getAppOutput } from "~/features/GetAppOutput/GetAppOutput.js";
import { getAppStackOutput } from "~/features/GetAppStackOutput/GetAppStackOutput.js";
import { getPulumiResourceNamePrefix } from "~/features/GetPulumiResourceNamePrefix/GetPulumiResourceNamePrefix.js";
import { refreshApp } from "~/features/RefreshApp/RefreshApp.js";
import { runPulumiCommand } from "~/features/RunPulumiCommand/RunPulumiCommand.js";

// Services
import { watchedLambdaFunctionsService } from "~/services/WatchedLambdaFunctionsService/WatchedLambdaFunctionsService.js";
import { isRemotePulumiBackendService } from "~/services/IsRemotePulumiBackendService/IsRemotePulumiBackendService.js";
import { listAppLambdaFunctionsService } from "~/services/ListAppLambdaFunctionsService/ListAppLambdaFunctionsService.js";
import { listDeployedEnvironmentsService } from "~/services/ListDeployedEnvironmentsService/ListDeployedEnvironmentsService.js";
import { pulumiGetConfigPassphraseService } from "~/services/PulumiGetConfigPassphraseService/PulumiGetConfigPassphraseService.js";
import { pulumiGetSecretsProviderService } from "~/services/PulumiGetSecretsProviderService/PulumiGetSecretsProviderService.js";
import { pulumiExportService } from "~/services/PulumiExportService/PulumiExportService.js";
import { pulumiImportService } from "~/services/PulumiImportService/PulumiImportService.js";
import { pulumiGetStackOutputService } from "~/services/PulumiGetStackOutputService/PulumiGetStackOutputService.js";
import { pulumiLoginService } from "~/services/PulumiLoginService/PulumiLoginService.js";
import { pulumiSelectStackService } from "~/services/PulumiSelectStackService/PulumiSelectStackService.js";

import { getPulumiService } from "./services/GetPulumiService/GetPulumiService.js";
import { getPulumiVersionService } from "~/services/GetPulumiVersionService/GetPulumiVersionService.js";
import { stackOutputCacheService } from "~/services/StackOutputCacheService/StackOutputCacheService.js";
import { awsPulumiInitHostingSdkService } from "~/services/AwsPulumiInitHostingSdkService/AwsPulumiInitHostingSdkService.js";
import { awsDeployInitHostingSdkService } from "~/services/AwsDeployInitHostingSdkService/AwsDeployInitHostingSdkService.js";
import { projectInfoWithPulumi } from "~/decorators/ProjectInfoWithPulumi.js";

// Hooks
import { beforeDeploy } from "~/features/hooks/BeforeDeploy/BeforeDeploy.js";
import { afterDeploy } from "~/features/hooks/AfterDeploy/AfterDeploy.js";
import { coreBeforeBuild } from "@webiny/project/features/hooks/index.js";
import { coreAfterBuild } from "@webiny/project/features/hooks/index.js";
import { coreBeforeWatch } from "@webiny/project/features/hooks/index.js";
import { coreBeforeDeploy } from "~/features/hooks/CoreBeforeDeploy/CoreBeforeDeploy.js";
import { coreAfterDeploy } from "~/features/hooks/CoreAfterDeploy/CoreAfterDeploy.js";
import { apiBeforeDeploy } from "~/features/hooks/ApiBeforeDeploy/ApiBeforeDeploy.js";
import { apiAfterDeploy } from "~/features/hooks/ApiAfterDeploy/ApiAfterDeploy.js";
import { adminBeforeDeploy } from "~/features/hooks/AdminBeforeDeploy/AdminBeforeDeploy.js";
import { adminAfterDeploy } from "~/features/hooks/AdminAfterDeploy/AdminAfterDeploy.js";

import { awsWatch } from "./features/Watch/AwsWatch.js";
import { BuildProjectWorkspace } from "./extensions/ProjectAws/BuildProjectWorkspace.js";
import { BuildAppWorkspace } from "./extensions/ProjectAws/BuildAppWorkspace.js";

/**
 * Pulumi services + features only — no deploy/workspace decorators or hooks. Safe to register in the
 * Pulumi program's own ProjectSdk container (a separate process that must resolve the name prefix,
 * stack output, etc. without re-running the CLI's workspace builders or deploy decorators).
 */
export const registerAwsPulumiServices = (container: Container): void => {
    // Pulumi/Lambda services.
    container.register(getPulumiService).inSingletonScope();
    container.register(isRemotePulumiBackendService).inSingletonScope();
    container.register(listAppLambdaFunctionsService).inSingletonScope();
    container.register(listDeployedEnvironmentsService).inSingletonScope();
    container.register(watchedLambdaFunctionsService).inSingletonScope();
    container.register(pulumiGetConfigPassphraseService).inSingletonScope();
    container.register(pulumiGetSecretsProviderService).inSingletonScope();
    container.register(pulumiExportService).inSingletonScope();
    container.register(pulumiImportService).inSingletonScope();
    container.register(pulumiGetStackOutputService).inSingletonScope();
    container.register(pulumiLoginService).inSingletonScope();
    container.register(pulumiSelectStackService).inSingletonScope();
    container.register(getPulumiVersionService).inSingletonScope();
    container.register(stackOutputCacheService).inSingletonScope();
    container.register(awsPulumiInitHostingSdkService).inSingletonScope();

    // Deploy/Pulumi features.
    container.register(deployApp).inSingletonScope();
    container.register(destroyApp).inSingletonScope();
    container.register(exportStack).inSingletonScope();
    container.register(getAppOutput).inSingletonScope();
    container.register(getAppStackOutput).inSingletonScope();
    container.register(getPulumiResourceNamePrefix).inSingletonScope();
    container.register(refreshApp).inSingletonScope();
    container.register(runPulumiCommand).inSingletonScope();
};

export const registerAwsProjectFeatures = (container: Container): void => {
    // Workspace decorators — must be registered before workspace services execute.
    container.registerDecorator(BuildProjectWorkspace);
    container.registerDecorator(BuildAppWorkspace);

    // Pulumi services + features (shared with the Pulumi program).
    registerAwsPulumiServices(container);

    // Deploy + core hooks.
    container.registerComposite(beforeDeploy);
    container.registerComposite(afterDeploy);
    container.registerComposite(coreBeforeBuild);
    container.registerComposite(coreAfterBuild);
    container.registerComposite(coreBeforeWatch);
    container.registerComposite(coreBeforeDeploy);
    container.registerComposite(coreAfterDeploy);
    container.registerComposite(apiBeforeDeploy);
    container.registerComposite(apiAfterDeploy);
    container.registerComposite(adminBeforeDeploy);
    container.registerComposite(adminAfterDeploy);

    // Deploy hooks from the config and the deploy decorators, registered once the config is loaded.
    container.register(awsDeployInitHostingSdkService).inSingletonScope();

    container.registerDecorator(projectInfoWithPulumi);

    // Watch decorator that adds Lambda hot-reload.
    container.registerDecorator(awsWatch);
};
