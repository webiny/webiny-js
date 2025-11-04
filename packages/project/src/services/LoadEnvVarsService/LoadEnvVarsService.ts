import { createImplementation } from "@webiny/di-container";
import { GetProjectService, LoadEnvVarsService, LoggerService } from "~/abstractions/index.js";
import dotenv from "dotenv";

export class DefaultLoadEnvVarsService implements LoadEnvVarsService.Interface {
    constructor(
        private getProjectService: GetProjectService.Interface,
        private loggerService: LoggerService.Interface
    ) {}

    async execute() {
        const project = this.getProjectService.execute();

        const logger = this.loggerService;

        const dotEnvFilePath = project.paths.rootFolder.join(".env").toString();
        const { error } = dotenv.config({ path: dotEnvFilePath });
        if (error) {
            logger.warn({ err: error, dotEnvFilePath }, `No environment variables file found.`);
        } else {
            logger.trace({ dotEnvFilePath }, `Successfully loaded environment variables.`);
        }
    }
}

export const loadEnvVarsService = createImplementation({
    abstraction: LoadEnvVarsService,
    implementation: DefaultLoadEnvVarsService,
    dependencies: [GetProjectService, LoggerService]
});
