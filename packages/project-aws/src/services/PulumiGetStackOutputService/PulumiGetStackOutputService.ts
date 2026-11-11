import { createImplementation } from "@webiny/di";
import { GetPulumiService } from "~/abstractions/services/GetPulumiService.js";
import { LoggerService } from "@webiny/project/abstractions/index.js";
import { PulumiGetStackOutputService } from "~/abstractions/services/PulumiGetStackOutputService.js";
import { PulumiSelectStackService } from "~/abstractions/services/PulumiSelectStackService.js";
import { StackOutputCacheService } from "~/abstractions/services/StackOutputCacheService.js";
import { type AppModel } from "@webiny/project/models/index.js";
import { createEnvConfiguration } from "@webiny/project/utils/env/index.js";
import { withPulumiConfigPassphrase } from "~/utils/withPulumiConfigPassphrase.js";
import { mapStackOutput } from "./mapStackOutput.js";

export class DefaultPulumiGetStackOutputService implements PulumiGetStackOutputService.Interface {
    constructor(
        private getPulumiService: GetPulumiService.Interface,
        private pulumiSelectStackService: PulumiSelectStackService.Interface,
        private loggerService: LoggerService.Interface,
        private stackOutputCacheService: StackOutputCacheService.Interface
    ) {}

    async execute<TOutput extends Record<string, any> = Record<string, any>>(
        app: AppModel,
        params?: PulumiGetStackOutputService.Params
    ): Promise<TOutput | null> {
        // Try to read from cache if skipCache is not true
        if (!params?.skipCache) {
            const cachedOutput = await this.stackOutputCacheService.read(app);
            if (cachedOutput !== null) {
                return this.applyMapping(cachedOutput, params?.map) as TOutput;
            }
        }

        const pulumi = await this.getPulumiService.execute({ app });

        await this.pulumiSelectStackService.execute(app);

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
            const stackOutputJson = JSON.parse(stackOutputString.stdout as string);
            if (!stackOutputJson) {
                return null;
            }

            await this.stackOutputCacheService.write(app, stackOutputJson);

            return this.applyMapping(stackOutputJson, params?.map) as TOutput;
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

    private applyMapping(
        data: Record<string, any>,
        map?: Record<string, any>
    ): Record<string, any> {
        if (!map) {
            return data;
        }
        // If a mapping is provided, we map the output to the specified structure.
        return mapStackOutput(data, map);
    }
}

export const pulumiGetStackOutputService = createImplementation({
    abstraction: PulumiGetStackOutputService,
    implementation: DefaultPulumiGetStackOutputService,
    dependencies: [
        GetPulumiService,
        PulumiSelectStackService,
        LoggerService,
        StackOutputCacheService
    ]
});
