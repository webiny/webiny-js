import { GetProjectConfigService } from "@webiny/project/abstractions/index.js";
import { DatabaseSetup } from "@webiny/project/extensions/index.js";
import { CorePulumi } from "~/abstractions/features/pulumi/index.js";
import type { CorePulumiApp } from "~/pulumi/apps/core/createCorePulumiApp.js";

class SetDatabaseSetupOutputImpl implements CorePulumi.Interface {
    constructor(private getProjectConfigService: GetProjectConfigService.Interface) {}

    async execute(app: CorePulumiApp): Promise<void> {
        // Get the DatabaseSetup extension value
        const projectConfig = await this.getProjectConfigService.execute();

        const [databaseSetupExtension] = projectConfig.extensionsByType(DatabaseSetup);

        if (databaseSetupExtension) {
            const databaseSetup = databaseSetupExtension.params.setupName;
            app.addOutputs({
                databaseSetup
            });
        } else {
            // Default to 'ddb' if no DatabaseSetup extension is found
            app.addOutputs({
                databaseSetup: "ddb"
            });
        }
    }
}

export const SetDatabaseSetupOutput = CorePulumi.createImplementation({
    implementation: SetDatabaseSetupOutputImpl,
    dependencies: [GetProjectConfigService]
});
