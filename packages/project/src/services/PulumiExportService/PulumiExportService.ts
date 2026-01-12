import { createImplementation } from "@webiny/di";
import {
    GetPulumiService,
    LoggerService,
    PulumiExportService,
    PulumiSelectStackService
} from "~/abstractions/index.js";
import { type AppModel } from "~/models/index.js";
import { createEnvConfiguration, withPulumiConfigPassphrase } from "~/utils/env/index.js";

export class DefaultPulumiExportService implements PulumiExportService.Interface {
    constructor(
        private getPulumiService: GetPulumiService.Interface,
        private pulumiSelectStackService: PulumiSelectStackService.Interface,
        private loggerService: LoggerService.Interface
    ) {}

    async execute(app: AppModel) {
        const pulumi = await this.getPulumiService.execute({ app });

        await this.pulumiSelectStackService.execute(app);

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
                app
            );
            return null;
        }
    }
}

export const pulumiExportService = createImplementation({
    abstraction: PulumiExportService,
    implementation: DefaultPulumiExportService,
    dependencies: [GetPulumiService, PulumiSelectStackService, LoggerService]
});

// Backwards compatibility
/** @deprecated Use pulumiExportService instead */
export const pulumiGetStackExportService = pulumiExportService;
export const DefaultPulumiGetStackExportService = DefaultPulumiExportService;
