import { Container } from "@webiny/di";

// Features
import {
    deployApp,
    destroyApp,
    exportStack,
    getAppOutput,
    getAppStackOutput,
    getPulumiResourceNamePrefix,
    refreshApp,
    runPulumiCommand
} from "@webiny/project/features/index.js";

// Services
import {
    watchedLambdaFunctionsService,
    isRemotePulumiBackendService,
    listAppLambdaFunctionsService,
    listDeployedEnvironmentsService,
    pulumiGetConfigPassphraseService,
    pulumiGetSecretsProviderService,
    pulumiExportService,
    pulumiImportService,
    pulumiGetStackOutputService,
    pulumiLoginService,
    pulumiSelectStackService
} from "@webiny/project/services/index.js";

// GetPulumiService implementation lives here since it directly imports @webiny/pulumi-sdk
import { getPulumiService } from "./services/GetPulumiService/GetPulumiService.js";

// Hooks
import {
    beforeDeploy,
    afterDeploy,
    coreBeforeBuild,
    coreAfterBuild,
    coreBeforeWatch,
    coreBeforeDeploy,
    coreAfterDeploy,
    apiBeforeDeploy,
    apiAfterDeploy,
    adminBeforeDeploy,
    adminAfterDeploy
} from "@webiny/project/features/hooks/index.js";

// Decorators
import {
    deployAppWithWatchedLambdaReplacement,
    deployAppClearWatchedLambdaFunctions,
    deployAppRefreshStackOutputCache,
    deployAppWithHooks,
    getPulumiServiceWithDownloadInfo
} from "@webiny/project/decorators/index.js";

import { awsWatch } from "./features/Watch/AwsWatch.js";
import { BuildProjectWorkspace } from "./extensions/ProjectAws/BuildProjectWorkspace.js";
import { BuildAppWorkspace } from "./extensions/ProjectAws/BuildAppWorkspace.js";

export const registerAwsProjectFeatures = (container: Container): void => {
    // Workspace decorators — must be registered before workspace services execute.
    container.registerDecorator(BuildProjectWorkspace);
    container.registerDecorator(BuildAppWorkspace);
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

    // Deploy/Pulumi features.
    container.register(deployApp).inSingletonScope();
    container.register(destroyApp).inSingletonScope();
    container.register(exportStack).inSingletonScope();
    container.register(getAppOutput).inSingletonScope();
    container.register(getAppStackOutput).inSingletonScope();
    container.register(getPulumiResourceNamePrefix).inSingletonScope();
    container.register(refreshApp).inSingletonScope();
    container.register(runPulumiCommand).inSingletonScope();

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

    // Deploy decorators (registered before InitProjectSdkService adds watchWithHooks etc.).
    container.registerDecorator(deployAppWithWatchedLambdaReplacement);
    container.registerDecorator(deployAppClearWatchedLambdaFunctions);
    container.registerDecorator(deployAppRefreshStackOutputCache);
    container.registerDecorator(deployAppWithHooks);
    container.registerDecorator(getPulumiServiceWithDownloadInfo);

    // Watch decorator that adds Lambda hot-reload.
    container.registerDecorator(awsWatch);
};
