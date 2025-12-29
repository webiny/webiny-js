import path from "path";
import { Container } from "@webiny/di";
import {
    argvParserService,
    cliParamsService,
    commandsRegistryService,
    getArgvService,
    getCliRunnerService,
    globalOptionsRegistryService,
    getProjectSdkService,
    loggerService,
    runCliRunnerService,
    stdioService,
    uiService
} from "./services/index.js";

import {
    aboutCommand,
    buildCommand,
    ddbPutItemConditionalCheckFailedGracefulErrorHandler,
    deployCommand,
    destroyCommand,
    infoCommand,
    openCommand,
    missingFilesInBuildGracefulErrorHandler,
    outputCommand,
    pendingOperationsGracefulErrorHandler,
    pulumiCommand,
    refreshCommand,
    enableTelemetryCommand,
    disableTelemetryCommand,
    syncDepsCommand,
    verifyDepsCommand,
    watchCommand,

    // WCP
    linkProjectCommand,
    loginCommand,
    logoutCommand,
    whoAmICommand,

    // Global Options
    showLogsGlobalOption,
    logLevelGlobalOption,
    stackTraceGlobalOption
} from "./features/index.js";

import chalk from "chalk";
import {
    CliParamsService,
    GetArgvService,
    GetProjectSdkService,
    UiService
} from "~/abstractions/index.js";
import { GracefulError } from "@webiny/project";
import {
    commandsWithGracefulErrorHandling,
    deployCommandWithTelemetry
} from "./decorators/index.js";
import { CliCommand } from "~/extensions/index.js";

const { bgYellow, bold } = chalk;

export const createCliContainer = async (params: CliParamsService.Params) => {
    const container = new Container();

    // Features (commands).
    container.register(aboutCommand).inSingletonScope();
    container.register(buildCommand).inSingletonScope();
    container.register(deployCommand).inSingletonScope();
    container.register(pulumiCommand).inSingletonScope();
    container.register(refreshCommand).inSingletonScope();
    container.register(enableTelemetryCommand).inSingletonScope();
    container.register(disableTelemetryCommand).inSingletonScope();
    container.register(syncDepsCommand).inSingletonScope();
    container.register(verifyDepsCommand).inSingletonScope();
    container.register(destroyCommand).inSingletonScope();
    container.register(infoCommand).inSingletonScope();
    container.register(openCommand).inSingletonScope();
    container.register(outputCommand).inSingletonScope();
    container.register(watchCommand).inSingletonScope();

    container.register(linkProjectCommand).inSingletonScope();
    container.register(loginCommand).inSingletonScope();
    container.register(logoutCommand).inSingletonScope();
    container.register(whoAmICommand).inSingletonScope();

    // Graceful error handlers.
    container.register(ddbPutItemConditionalCheckFailedGracefulErrorHandler).inSingletonScope();
    container.register(missingFilesInBuildGracefulErrorHandler).inSingletonScope();
    container.register(pendingOperationsGracefulErrorHandler).inSingletonScope();

    // Global options.
    container.register(showLogsGlobalOption).inSingletonScope();
    container.register(logLevelGlobalOption).inSingletonScope();
    container.register(stackTraceGlobalOption).inSingletonScope();

    // Services.
    container.register(argvParserService).inSingletonScope();
    container.register(cliParamsService).inSingletonScope();
    container.register(commandsRegistryService).inSingletonScope();
    container.register(getArgvService).inSingletonScope();
    container.register(getCliRunnerService).inSingletonScope();
    container.register(globalOptionsRegistryService).inSingletonScope();
    container.register(getProjectSdkService).inSingletonScope();
    container.register(loggerService).inSingletonScope();
    container.register(runCliRunnerService).inSingletonScope();
    container.register(stdioService).inSingletonScope();
    container.register(uiService).inSingletonScope();

    // Extensions.
    const ui = container.resolve(UiService);

    // TODO: not sure how I feel about this. We should probably revisit this.
    try {
        // Immediately set CLI instance params via the `CliParamsService`.
        container.resolve(CliParamsService).set(params);

        const projectSdk = await container.resolve(GetProjectSdkService).execute();

        const projectConfig = await projectSdk.getProjectConfig({
            tags: { runtimeContext: "cli" }
        });

        await projectSdk.validateProjectConfig(projectConfig);

        const project = projectSdk.getProject();

        const importFromPath = async (filePath: string) => {
            let importPath = filePath;
            if (!path.isAbsolute(filePath)) {
                // If the path is not absolute, we assume it's relative to the current working directory.
                importPath = project.paths.rootFolder.join(filePath).toString();
            }

            const exportName = path.basename(filePath).replace(path.extname(filePath), "");

            const importedModule = await import(importPath);
            return importedModule[exportName];
        };

        const commands = projectConfig.extensionsByType(CliCommand);
        for (const command of commands) {
            const commandImplementation = await importFromPath(command.params.src);

            container.register(commandImplementation).inSingletonScope();
        }
    } catch (error) {
        let realError = error;
        if (error.cause) {
            realError = error.cause as Error;
        }

        ui.error(realError.message);

        const argv = container.resolve(GetArgvService).execute();
        if (argv.showStackTrace && realError.stack) {
            ui.newLine();
            ui.debug("Stack trace:");
            ui.text(realError.stack);
        }

        if (error && error instanceof GracefulError) {
            ui.newLine();
            ui.text(bgYellow(bold("💡 How can I resolve this?")));
            ui.text(error.message);
        }

        process.exit(1);
    }

    // Decorators.
    container.registerDecorator(commandsWithGracefulErrorHandling);
    container.registerDecorator(deployCommandWithTelemetry);

    return container;
};
