import { CliCommandFactory } from "~/abstractions/index.js";
import { UpgradeCommandHandler } from "./abstraction.js";
import semver from "semver";

export interface UpgradeCommandParams {
    skipChecks?: boolean;
    disableSemver?: boolean;
    debug?: boolean;
    _: string[];
    logLevel?: string;
    showLogs?: boolean;
    showStackTrace?: boolean;
    version?: string;
}

export class UpgradeCommand implements CliCommandFactory.Interface<UpgradeCommandParams> {
    public constructor(private upgradeCommandHandler: UpgradeCommandHandler.Interface) {}

    public async execute(): Promise<CliCommandFactory.CommandDefinition<UpgradeCommandParams>> {
        return {
            name: "upgrade",
            description:
                "Upgrade Webiny packages and dependencies to the latest or selected version.",
            examples: ["upgrade", "upgrade 6.2.0", "upgrade 0.0.0-unstable.abc --disable-semver"],
            params: [
                {
                    name: "version",
                    description:
                        "Version to upgrade to. Can be a specific version (e.g. 6.2.0) or 'latest' to upgrade to the latest version.",
                    type: "string",
                    default: "latest",
                    required: false
                }
            ],
            options: [
                {
                    name: "disable-semver",
                    description:
                        "Disable semver parsing to allow for versions that don't follow semver, such as 'latest', 0.0.0-unstable, etc...",
                    type: "boolean",
                    default: false
                },
                {
                    name: "skip-checks",
                    description: "Do not perform CLI version and Git tree checks.",
                    type: "boolean",
                    default: false
                },
                {
                    name: "debug",
                    default: false,
                    description: `Turn on debug logs`,
                    type: "boolean"
                }
            ],
            handler: async params => {
                /**
                 * We assign only what we want so that we don't accidentally pass some parameters that are not relevant to the handler.
                 */
                const version = this.getVersion(params);
                return this.upgradeCommandHandler.handle({
                    logLevel: params.logLevel || "info",
                    showLogs: params.showLogs || false,
                    showStackTrace: params.showStackTrace || false,
                    skipChecks: params.skipChecks || false,
                    debug: params.debug || false,
                    disableSemver: params.disableSemver || false,
                    version
                });
            }
        };
    }

    private getVersion(params: UpgradeCommandParams): UpgradeCommandHandler.Version {
        const version = params._[1];
        if (!version || version === "latest") {
            return "latest";
        }
        if (params.disableSemver) {
            return version as UpgradeCommandHandler.Version;
        }

        try {
            const parsed = semver.parse(version);
            if (!parsed) {
                throw new Error();
            }
            return parsed.format() as UpgradeCommandHandler.Version;
        } catch (ex) {
            throw new Error(
                `Invalid version provided: "${version}". Use --disable-semver to allow non-semver versions: ${ex.message}`
            );
        }
    }
}

export const upgradeCommand = CliCommandFactory.createImplementation({
    implementation: UpgradeCommand,
    dependencies: [UpgradeCommandHandler]
});
