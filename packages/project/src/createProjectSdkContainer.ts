import { Container } from "@webiny/di-container";
import {
    beforeBuild,
    afterBuild,
    adminAfterBuild,
    adminAfterDeploy,
    adminBeforeBuild,
    adminBeforeDeploy,
    adminPulumi,
    apiAfterBuild,
    apiAfterDeploy,
    apiBeforeBuild,
    apiBeforeDeploy,
    apiPulumi,
    buildApp,
    coreAfterBuild,
    coreAfterDeploy,
    coreBeforeBuild,
    coreBeforeDeploy,
    corePulumi,
    deployApp,
    destroyApp,
    getApp,
    getAppOutput,
    getAppStackExport,
    getAppStackOutput,
    getLogger,
    getProductionEnvironments,
    getProject,
    getProjectConfig,
    getProjectInfo,
    getPulumiResourceNamePrefix,
    isCi,
    isTelemetryEnabled,
    refreshApp,
    runPulumiCommand,
    validateProjectConfig,
    watch,
    websiteAfterBuild,
    websiteAfterDeploy,
    websiteBeforeBuild,
    websiteBeforeDeploy,
    websitePulumi
} from "./features/index.js";

import {
    getAppPackagesService,
    getCwdService,
    getIsCiService,
    getNpmVersionService,
    getNpxVersionService,
    getProjectConfigService,
    getProjectService,
    getProjectVersionService,
    getPulumiService,
    getPulumiVersionService,
    getYarnVersionService,
    listAppLambdaFunctionsService,
    listPackagesInAppWorkspaceService,
    listPackagesService,
    loggerService,
    projectInfoService,
    projectSdkParamsService,
    pulumiGetConfigPassphraseService,
    pulumiGetSecretsProviderService,
    pulumiGetStackExportService,
    pulumiGetStackOutputService,
    pulumiLoginService,
    pulumiSelectStackService,
    stdioService,
    uiService,
    validateProjectConfigService
} from "./services/index.js";

import { buildAppWithHooks, deployAppWithHooks } from "./decorators/index.js";

import {
    GetProject,
    GetProjectConfig,
    ProjectSdkParamsService,
    ValidateProjectConfig
} from "~/abstractions/index.js";
import path from "path";

export const createProjectSdkContainer = async (
    params: Partial<ProjectSdkParamsService.Params>
) => {
    const container = new Container();

    // Services.
    container.register(projectSdkParamsService).inSingletonScope();
    container.register(getAppPackagesService).inSingletonScope();
    container.register(getCwdService).inSingletonScope();
    container.register(getIsCiService).inSingletonScope();
    container.register(getNpmVersionService).inSingletonScope();
    container.register(getNpxVersionService).inSingletonScope();
    container.register(getProjectConfigService).inSingletonScope();
    container.register(getProjectService).inSingletonScope();
    container.register(getProjectVersionService).inSingletonScope();
    container.register(getPulumiService).inSingletonScope();
    container.register(getPulumiVersionService).inSingletonScope();
    container.register(getYarnVersionService).inSingletonScope();
    container.register(listAppLambdaFunctionsService).inSingletonScope();
    container.register(listPackagesService).inSingletonScope();
    container.register(listPackagesInAppWorkspaceService).inSingletonScope();
    container.register(loggerService).inSingletonScope();
    container.register(projectInfoService).inSingletonScope();
    container.register(pulumiGetConfigPassphraseService).inSingletonScope();
    container.register(pulumiGetSecretsProviderService).inSingletonScope();
    container.register(pulumiGetStackExportService).inSingletonScope();
    container.register(pulumiGetStackOutputService).inSingletonScope();
    container.register(pulumiLoginService).inSingletonScope();
    container.register(pulumiSelectStackService).inSingletonScope();
    container.register(stdioService).inSingletonScope();
    container.register(uiService).inSingletonScope();
    container.register(validateProjectConfigService).inSingletonScope();

    // Features.
    container.register(buildApp).inSingletonScope();
    container.register(deployApp).inSingletonScope();
    container.register(destroyApp).inSingletonScope();
    container.register(getApp).inSingletonScope();
    container.register(getAppOutput).inSingletonScope();
    container.register(getAppStackExport).inSingletonScope();
    container.register(getAppStackOutput).inSingletonScope();
    container.register(getLogger).inSingletonScope();
    container.register(getProductionEnvironments).inSingletonScope();
    container.register(getProject).inSingletonScope();
    container.register(getProjectConfig).inSingletonScope();
    container.register(getProjectInfo).inSingletonScope();
    container.register(getPulumiResourceNamePrefix).inSingletonScope();
    container.register(isCi).inSingletonScope();
    container.register(isTelemetryEnabled).inSingletonScope();
    container.register(refreshApp).inSingletonScope();
    container.register(runPulumiCommand).inSingletonScope();
    container.register(validateProjectConfig).inSingletonScope();
    container.register(watch).inSingletonScope();

    // Hooks.
    container.registerComposite(beforeBuild);
    container.registerComposite(afterBuild);
    container.registerComposite(apiBeforeBuild);
    container.registerComposite(apiBeforeDeploy);
    container.registerComposite(apiAfterBuild);
    container.registerComposite(apiAfterDeploy);
    container.registerComposite(adminBeforeBuild);
    container.registerComposite(adminBeforeDeploy);
    container.registerComposite(adminAfterBuild);
    container.registerComposite(adminAfterDeploy);
    container.registerComposite(coreBeforeBuild);
    container.registerComposite(coreBeforeDeploy);
    container.registerComposite(coreAfterBuild);
    container.registerComposite(coreAfterDeploy);
    container.registerComposite(websiteBeforeBuild);
    container.registerComposite(websiteBeforeDeploy);
    container.registerComposite(websiteAfterBuild);
    container.registerComposite(websiteAfterDeploy);

    // Immediately set CLI instance params via the `CliParamsService`.
    container.resolve(ProjectSdkParamsService).set(params);

    // Extensions.
    const project = await container.resolve(GetProject).execute();
    const projectExtensions = await container.resolve(GetProjectConfig).execute({
        tags: { runtimeContext: "project" }
    });

    await container.resolve(ValidateProjectConfig).execute(projectExtensions);

    const importFromPath = (filePath: string) => {
        let importPath = filePath;
        if (!path.isAbsolute(filePath)) {
            // If the path is not absolute, we assume it's relative to the current working directory.
            importPath = project.paths.rootFolder.join(filePath).toString();
        }
        
        //eslint-disable-next-line import/dynamic-import-chunkname
        return import(importPath);
    };

    // Hooks.
    const hooksExtensions = [
        ...projectExtensions.extensionsByType<any>("Project/BeforeBuild"),
        ...projectExtensions.extensionsByType<any>("Project/AfterBuild"),
        ...projectExtensions.extensionsByType<any>("Admin/BeforeBuild"),
        ...projectExtensions.extensionsByType<any>("Admin/BeforeDeploy"),
        ...projectExtensions.extensionsByType<any>("Admin/AfterBuild"),
        ...projectExtensions.extensionsByType<any>("Admin/AfterDeploy"),
        ...projectExtensions.extensionsByType<any>("Api/BeforeBuild"),
        ...projectExtensions.extensionsByType<any>("Api/BeforeDeploy"),
        ...projectExtensions.extensionsByType<any>("Api/AfterBuild"),
        ...projectExtensions.extensionsByType<any>("Api/AfterDeploy"),
        ...projectExtensions.extensionsByType<any>("Core/BeforeBuild"),
        ...projectExtensions.extensionsByType<any>("Core/BeforeDeploy"),
        ...projectExtensions.extensionsByType<any>("Core/AfterBuild"),
        ...projectExtensions.extensionsByType<any>("Core/AfterDeploy"),
        ...projectExtensions.extensionsByType<any>("Website/BeforeBuild"),
        ...projectExtensions.extensionsByType<any>("Website/BeforeDeploy"),
        ...projectExtensions.extensionsByType<any>("Website/AfterBuild"),
        ...projectExtensions.extensionsByType<any>("Website/AfterDeploy")
    ];

    for (const hookExtension of hooksExtensions) {
        const { default: hookImpl } = await importFromPath(hookExtension.params.src);
        container.register(hookImpl).inSingletonScope();
    }

    const pulumiExtensions = [
        ...projectExtensions.extensionsByType<any>("Core/Pulumi"),
        ...projectExtensions.extensionsByType<any>("Api/Pulumi"),
        ...projectExtensions.extensionsByType<any>("Admin/Pulumi"),
        ...projectExtensions.extensionsByType<any>("Website/Pulumi")
    ];

    for (const pulumiExtension of pulumiExtensions) {
        const { default: pulumiImpl } = await importFromPath(pulumiExtension.params.src);
        container.register(pulumiImpl).inSingletonScope();
    }

    // Pulumi.
    container.registerComposite(corePulumi);
    container.registerComposite(apiPulumi);
    container.registerComposite(adminPulumi);
    container.registerComposite(websitePulumi);

    // Decorators that must be applied last on top of potentially custom ones.
    container.registerDecorator(buildAppWithHooks);
    container.registerDecorator(deployAppWithHooks);

    const projectDecorators = [...projectExtensions.extensionsByType<any>("Project/Decorator")];

    for (const projectDecorator of projectDecorators) {
        const { default: projectDecoratorImpl } = await importFromPath(projectDecorator.params.src);
        container.registerDecorator(projectDecoratorImpl);
    }

    return container;
};
