import path from "path";
import { Container } from "@webiny/di";
import {
    argvParserService,
    cliParamsService,
    commandsRegistryService,
    defaultAppsService,
    getArgvService,
    getCliRunnerService,
    getIsCiService,
    getProjectSdkService,
    globalOptionsRegistryService,
    loggerService,
    runCliRunnerService,
    stdioService,
    uiService
} from "./services/index.js";

import {
    aboutCommand,
    buildCommand,
    configCommand,
    disableTelemetryCommand,
    enableTelemetryCommand,
    extensionCommand,
    infoCommand,
    isCi,
    linkProjectCommand,
    loginCommand,
    logLevelGlobalOption,
    logoutCommand,
    missingFilesInBuildGracefulErrorHandler,
    openCommand,
    showLogsGlobalOption,
    stackTraceGlobalOption,
    syncDepsCommand,
    UpgradeCommandFeature,
    verifyDepsCommand,
    whoAmICommand
} from "./features/index.js";

import chalk from "chalk";
import {
    CliParamsService,
    GetArgvService,
    GetProjectSdkService,
    UiService
} from "~/abstractions/index.js";
import { GracefulError, toImportSpecifier } from "@webiny/project";
import { commandsWithGracefulErrorHandling } from "./decorators/index.js";
import { CliCommand } from "~/extensions/index.js";

const { bgYellow, bold } = chalk;

export const createCliContainer = async (
    params: CliParamsService.Params,
    register?: (container: Container) => void
) => {
    const container = new Container();

    // Core commands.
    container.register(aboutCommand).inSingletonScope();
    container.register(buildCommand).inSingletonScope();
    container.register(configCommand).inSingletonScope();
    container.register(enableTelemetryCommand).inSingletonScope();
    container.register(disableTelemetryCommand).inSingletonScope();
    container.register(extensionCommand).inSingletonScope();
    container.register(syncDepsCommand).inSingletonScope();
    container.register(verifyDepsCommand).inSingletonScope();
    container.register(infoCommand).inSingletonScope();
    container.register(isCi).inSingletonScope();
    container.register(openCommand).inSingletonScope();
    UpgradeCommandFeature.register(container);

    container.register(linkProjectCommand).inSingletonScope();
    container.register(loginCommand).inSingletonScope();
    container.register(logoutCommand).inSingletonScope();
    container.register(whoAmICommand).inSingletonScope();

    // Graceful error handlers.
    container.register(missingFilesInBuildGracefulErrorHandler).inSingletonScope();

    // Global options.
    container.register(showLogsGlobalOption).inSingletonScope();
    container.register(logLevelGlobalOption).inSingletonScope();
    container.register(stackTraceGlobalOption).inSingletonScope();

    // Services.
    container.register(argvParserService).inSingletonScope();
    container.register(cliParamsService).inSingletonScope();
    container.register(commandsRegistryService).inSingletonScope();
    container.register(defaultAppsService).inSingletonScope();
    container.register(getArgvService).inSingletonScope();
    container.register(getCliRunnerService).inSingletonScope();
    container.register(getIsCiService).inSingletonScope();
    container.register(globalOptionsRegistryService).inSingletonScope();
    container.register(getProjectSdkService).inSingletonScope();
    container.register(loggerService).inSingletonScope();
    container.register(runCliRunnerService).inSingletonScope();
    container.register(stdioService).inSingletonScope();
    container.register(uiService).inSingletonScope();

    // Allow flavour-specific registrations (e.g. cli-aws, cli-server).
    register?.(container);

    // Extensions.
    const ui = container.resolve(UiService);

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
            let importPath: string;
            if (filePath.startsWith("/extensions/")) {
                // Resolve from project root.
                importPath = project.paths.rootFolder.join(filePath).toString();
            } else {
                // Treat as absolute path.
                importPath = filePath;
            }

            const exportName = path.basename(filePath).replace(path.extname(filePath), "");

            const importedModule = await import(toImportSpecifier(importPath));

            // Support both default and named exports.
            // Check for 'default' property existence rather than truthiness.
            return (
                ("default" in importedModule && importedModule.default) ||
                importedModule[exportName]
            );
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
            ui.emptyLine();
            ui.debug("Stack trace:");
            ui.text(realError.stack);
        }

        if (error && error instanceof GracefulError) {
            ui.emptyLine();
            ui.text(bgYellow(bold("💡 How can I resolve this?")));
            ui.text(error.message);
        }

        process.exit(1);
    }

    // Decorators (must be registered after all commands).
    container.registerDecorator(commandsWithGracefulErrorHandling);

    return container;
};
