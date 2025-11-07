import { createImplementation } from "@webiny/di";
import { GetProjectSdkService, LoadEnvVarsService } from "~/abstractions/index.js";
import dotenv from "dotenv";

export class DefaultLoadEnvVarsService implements LoadEnvVarsService.Interface {
    constructor(private getProjectSdk: GetProjectSdkService.Interface) {}

    async execute() {
        const projectSdk = await this.getProjectSdk.execute();
        const logger = projectSdk.getLogger();

        const project = await projectSdk.getProject();
        const paths = [project.paths.rootFolder.join(".env").toString()];

        // Let's load environment variables
        for (let i = 0; i < paths.length; i++) {
            const path = paths[i];
            const { error } = dotenv.config({ path });
            if (error) {
                logger.warn(`No environment file found on %.`, path);
            } else {
                logger.trace(`Successfully loaded environment variables from %.`, path);
            }
        }

        // With 5.38.0, we are hiding the `WEBINY_ELASTICSEARCH_INDEX_LOCALE` env variable and always setting it to `true`.
        // This is because this variable is not something users should be concerned with, nor should they be able to change it.
        // In order to ensure backwards compatibility, we first check if the variable is set, and if it is, we don't override it.
        // Note: for v6, we decided to leave this "just in case".
        const esIndexLocaleEnvVarExists = "WEBINY_ELASTICSEARCH_INDEX_LOCALE" in process.env;
        if (!esIndexLocaleEnvVarExists) {
            process.env.WEBINY_ELASTICSEARCH_INDEX_LOCALE = "true";
        }
    }
}

export const loadEnvVarsService = createImplementation({
    abstraction: LoadEnvVarsService,
    implementation: DefaultLoadEnvVarsService,
    dependencies: [GetProjectSdkService]
});
