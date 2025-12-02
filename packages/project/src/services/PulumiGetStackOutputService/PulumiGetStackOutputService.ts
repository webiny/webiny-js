import { createImplementation } from "@webiny/di";
import {
    GetPulumiService,
    LoggerService,
    PulumiGetStackOutputService,
    PulumiSelectStackService
} from "~/abstractions/index.js";
import { type AppModel } from "~/models/index.js";
import { createEnvConfiguration, withPulumiConfigPassphrase } from "~/utils/env/index.js";
import { mapStackOutput } from "./mapStackOutput.js";

export class DefaultPulumiGetStackOutputService implements PulumiGetStackOutputService.Interface {
    constructor(
        private getPulumiService: GetPulumiService.Interface,
        private pulumiSelectStackService: PulumiSelectStackService.Interface,
        private loggerService: LoggerService.Interface
    ) {}

    async execute(app: AppModel, params: PulumiGetStackOutputService.Params) {
        const pulumi = await this.getPulumiService.execute({ app });

        await this.pulumiSelectStackService.execute(app, params);

        const stackOutputString = await pulumi.run({
            command: ["stack", "output"],
            args: {
                json: true
            },
            execa: {
                env: createEnvConfiguration({
                    configurations: [withPulumiConfigPassphrase()]
                })
            }
        });

        try {
            const stackOutputJson = JSON.parse(stackOutputString.stdout);
            if (!stackOutputJson) {
                return null;
            }

            const map = params.map;
            if (!map) {
                return stackOutputJson;
            }

            // If a mapping is provided, we map the output to the specified structure.
            return mapStackOutput(stackOutputJson, map);
        } catch {
            this.loggerService.error(
                "Could not parse stack output as JSON.",
                stackOutputString.stdout,
                app,
                params
            );
            return null;
        }
    }
}

export const pulumiGetStackOutputService = createImplementation({
    abstraction: PulumiGetStackOutputService,
    implementation: DefaultPulumiGetStackOutputService,
    dependencies: [GetPulumiService, PulumiSelectStackService, LoggerService]
});
