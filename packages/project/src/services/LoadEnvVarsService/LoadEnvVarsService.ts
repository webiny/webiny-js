import { createImplementation } from "@webiny/di";
import {
    GetProjectService,
    LoadEnvVarsService,
    LoggerService,
    ProjectSdkParamsService
} from "~/abstractions/index.js";
import dotenv from "dotenv";

export class DefaultLoadEnvVarsService implements LoadEnvVarsService.Interface {
    constructor(
        private getProjectService: GetProjectService.Interface,
        private loggerService: LoggerService.Interface,
        private projectSdkParamsService: ProjectSdkParamsService.Interface
    ) {}

    async execute() {
        const project = this.getProjectService.execute();
        const logger = this.loggerService;

        const loadEnvFile = (filePath: string, override = false) => {
            const { error } = dotenv.config({ path: filePath, quiet: true, override });
            if (error) {
                logger.trace({ err: error, filePath }, `No environment variables file found.`);
            } else {
                logger.trace({ filePath }, `Successfully loaded environment variables.`);
            }
        };

        const rootFolder = project.paths.rootFolder;

        loadEnvFile(rootFolder.join(".env").toString());

        const { env } = this.projectSdkParamsService.get();
        if (env) {
            loadEnvFile(rootFolder.join(`.env.${env}`).toString(), true);
        }
    }
}

export const loadEnvVarsService = createImplementation({
    abstraction: LoadEnvVarsService,
    implementation: DefaultLoadEnvVarsService,
    dependencies: [GetProjectService, LoggerService, ProjectSdkParamsService]
});
