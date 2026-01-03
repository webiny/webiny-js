import { CorePulumi } from "@webiny/project/abstractions/index.js";
import { ProjectSdk } from "@webiny/project";
import { DatabaseSetup } from "@webiny/project/extensions/index.js";

class SetDatabaseSetupOutput implements CorePulumi.Interface {
    constructor(private project: ProjectSdk) {}

    async execute(app: any): Promise<void> {
        // Get the DatabaseSetup extension value
        const databaseSetupExtension = this.project.config.getExtension(DatabaseSetup);
        
        if (databaseSetupExtension) {
            const databaseSetup = databaseSetupExtension.params.name;
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
    implementation: SetDatabaseSetupOutput,
    dependencies: [ProjectSdk]
});
