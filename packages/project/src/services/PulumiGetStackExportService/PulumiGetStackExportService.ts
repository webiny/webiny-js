import { createImplementation } from "@webiny/di";
import {
    GetPulumiService,
    LoggerService,
    PulumiGetStackExportService,
    PulumiSelectStackService
} from "~/abstractions/index.js";
import { type AppModel } from "~/models/index.js";
import { createEnvConfiguration, withPulumiConfigPassphrase } from "~/utils/env/index.js";

export class DefaultPulumiGetStackExportService implements PulumiGetStackExportService.Interface {
    constructor(
        private getPulumiService: GetPulumiService.Interface,
        private pulumiSelectStackService: PulumiSelectStackService.Interface,
        private loggerService: LoggerService.Interface
    ) {}

    async execute(app: AppModel, params: PulumiGetStackExportService.Params) {
        const pulumi = await this.getPulumiService.execute({ app });

        await this.pulumiSelectStackService.execute(app, params);

        const stackOutputString = await pulumi.run({
            command: ["stack", "export"],
            args: {},
            execa: {
                env: createEnvConfiguration({
                    configurations: [withPulumiConfigPassphrase()]
                })
            }
        });

        try {
            return JSON.parse(stackOutputString.stdout);
        } catch {
            this.loggerService.error(
                "Could not parse stack export as JSON.",
                stackOutputString.stdout,
                app,
                params
            );
            return null;
        }
    }
}

export const pulumiGetStackExportService = createImplementation({
    abstraction: PulumiGetStackExportService,
    implementation: DefaultPulumiGetStackExportService,
    dependencies: [GetPulumiService, PulumiSelectStackService, LoggerService]
});
