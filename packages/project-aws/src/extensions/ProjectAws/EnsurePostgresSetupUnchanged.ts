import { CoreBeforeDeploy } from "@webiny/project-extensions-aws/abstractions/index.js";
import { CoreStackOutputService } from "@webiny/project-extensions-aws/abstractions/index.js";
import { GetProjectConfigService } from "@webiny/project/abstractions/index.js";
import { DatabaseSetup } from "@webiny/project/extensions/index.js";
import { GracefulError } from "@webiny/project";

const POSTGRES = "pg";

/**
 * A core deployed with DynamoDB can't move to Postgres in place, nor the other way round: the data
 * lives in a different database. Compares the database setup the core was deployed with (its stack
 * output) with the one the project config now asks for. A first deploy has nothing to compare.
 *
 * Rendered by `ProjectAws`, not by `<Infra.Postgres />`, so it also runs when `<Infra.Postgres />`
 * is removed from a project that was deployed with it.
 */
export class EnsurePostgresSetupUnchangedImpl implements CoreBeforeDeploy.Interface {
    constructor(
        private coreStackOutputService: CoreStackOutputService.Interface,
        private getProjectConfigService: GetProjectConfigService.Interface
    ) {}

    async execute() {
        const output = await this.coreStackOutputService.execute();
        const deployedSetup = output?.databaseSetup;
        if (!deployedSetup) {
            return;
        }

        const projectConfig = await this.getProjectConfigService.execute();
        const [databaseSetupExtension] = projectConfig.extensionsByType(DatabaseSetup);
        const configuredSetup = databaseSetupExtension?.params.setupName ?? "ddb";

        const wasPostgres = deployedSetup === POSTGRES;
        const isPostgres = configuredSetup === POSTGRES;
        if (wasPostgres === isPostgres) {
            return;
        }

        const error = isPostgres
            ? new Error(
                  `Cannot deploy with Postgres. The Core application was deployed with the "${deployedSetup}" database setup.`
              )
            : new Error(
                  `Cannot deploy without Postgres. The Core application was deployed with the "${POSTGRES}" database setup.`
              );

        throw GracefulError.from(
            error,
            [
                "Once a project is deployed, it can't switch between %s and %s.",
                "",
                "Your options:",
                "• To switch, destroy the project and deploy it again from scratch.",
                "• To keep the current database, change your %s config file back (%s)."
            ].join("\n"),
            "DynamoDB",
            "Postgres",
            "webiny.config.tsx",
            isPostgres ? "remove <Infra.Postgres />" : "add <Infra.Postgres />"
        );
    }
}

export const EnsurePostgresSetupUnchanged = CoreBeforeDeploy.createImplementation({
    implementation: EnsurePostgresSetupUnchangedImpl,
    dependencies: [CoreStackOutputService, GetProjectConfigService]
});
