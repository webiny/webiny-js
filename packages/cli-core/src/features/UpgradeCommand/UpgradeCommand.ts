import { CliCommandFactory } from "~/abstractions/index.js";
import { UpgradeCommandHandler } from "./abstraction.js";

export class UpgradeCommand implements CliCommandFactory.Interface<UpgradeCommandHandler.Params> {
    public constructor(private upgradeCommandHandler: UpgradeCommandHandler.Interface) {}

    public async execute(): Promise<
        CliCommandFactory.CommandDefinition<UpgradeCommandHandler.Params>
    > {
        return {
            name: "upgrade",
            description: "Upgrade Webiny packages and dependencies to the latest or selected version.",
            examples: ["upgrade", "upgrade 6.2.0"],
            options: [],
            handler: async params => {
                /**
                 * We assign only what we want so that we don't accidentally pass some parameters that are not relevant to the handler.
                 */
                return this.upgradeCommandHandler.handle({
                    logLevel: params.logLevel,
                    showLogs: params.showLogs,
                    showStackTrace: params.showStackTrace,
                    _: params._
                });
            }
        };
    }
}

export const upgradeCommand = CliCommandFactory.createImplementation({
    implementation: UpgradeCommand,
    dependencies: [UpgradeCommandHandler]
});
