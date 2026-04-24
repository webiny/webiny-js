import { createImplementation } from "@webiny/di";
import fs from "fs";
import path from "path";
import os from "os";
import {
    GetPulumiService,
    LoggerService,
    PulumiImportService,
    PulumiSelectStackService
} from "~/abstractions/index.js";
import { type AppModel } from "~/models/index.js";
import { createEnvConfiguration, withPulumiConfigPassphrase } from "~/utils/env/index.js";

export class DefaultPulumiImportService implements PulumiImportService.Interface {
    constructor(
        private getPulumiService: GetPulumiService.Interface,
        private pulumiSelectStackService: PulumiSelectStackService.Interface,
        private loggerService: LoggerService.Interface
    ) {}

    async execute(app: AppModel, state: Record<string, any>) {
        const pulumi = await this.getPulumiService.execute({ app });

        await this.pulumiSelectStackService.execute(app);

        // Write state to temporary file (pulumi stack import requires --file flag)
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, `pulumi-state-${Date.now()}.json`);

        try {
            const stateJson = JSON.stringify(state, null, 2);
            fs.writeFileSync(tempFilePath, stateJson, "utf-8");

            this.loggerService.debug(`Importing Pulumi state from: ${tempFilePath}`);

            const result = await pulumi.run({
                command: ["stack", "import"],
                args: {
                    file: tempFilePath
                },
                execa: {
                    env: createEnvConfiguration({
                        configurations: [withPulumiConfigPassphrase()]
                    })
                }
            });

            this.loggerService.debug("Pulumi import output:", result.stdout);

            // Clean up temp file
            fs.unlinkSync(tempFilePath);
        } catch (error) {
            // Clean up temp file even on error
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
            this.loggerService.error("Failed to import Pulumi stack state.", error, app);
            throw error;
        }
    }
}

export const pulumiImportService = createImplementation({
    abstraction: PulumiImportService,
    implementation: DefaultPulumiImportService,
    dependencies: [GetPulumiService, PulumiSelectStackService, LoggerService]
});
