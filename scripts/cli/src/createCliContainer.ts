import { Container } from "@webiny/di";
import {
    cliParamsService,
    commandsRegistryService,
    getCliRunnerService,
    getCwdService,
    getProjectService,
    listPackagesService,
    loggerService,
    runCliRunnerService,
    stdioService,
    uiService,
} from "./services/index.js";

import { buildWebinyPkgCommand } from "./features/index.js";

import { CliParamsService } from "./abstractions/index.js";

export const createCliContainer = async (params: CliParamsService.Params) => {
    const container = new Container();

    // Services.
    container.register(cliParamsService).inSingletonScope();
    container.register(commandsRegistryService).inSingletonScope();
    container.register(getCliRunnerService).inSingletonScope();
    container.register(getCwdService).inSingletonScope();
    container.register(getProjectService).inSingletonScope();
    container.register(listPackagesService).inSingletonScope();
    container.register(loggerService).inSingletonScope();
    container.register(runCliRunnerService).inSingletonScope();
    container.register(stdioService).inSingletonScope();
    container.register(uiService).inSingletonScope();

    // Features (commands).
    container.register(buildWebinyPkgCommand).inSingletonScope();

    container.resolve(CliParamsService).set(params);

    return container;
};
