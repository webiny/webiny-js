import { CliCommandFactory, UiService } from "~/abstractions/index.js";
import { UpgradeCommandHandler } from "./abstraction.js";
import semver from "semver";

interface UpgradeCommandParams {
    skipChecks?: boolean;
    disableSemver?: boolean;
    debug?: boolean;
    _: string[];
    target?: string;
    logLevel?: string;
    showLogs?: boolean;
    showStackTrace?: boolean;
    version?: string;
    registry?: string;
    packageManager?: string;
    installVersion?: string;
    skipDependencyGuard?: boolean;
}

class UpgradeCommandImpl implements CliCommandFactory.Interface<UpgradeCommandParams> {
    public constructor(
        private ui: UiService.Interface,
        private upgradeCommandHandler: UpgradeCommandHandler.Interface
    ) {}

    public async execute(): Promise<CliCommandFactory.CommandDefinition<UpgradeCommandParams>> {
        return {
            name: "upgrade",
            description:
                "Upgrade Webiny packages and dependencies to the latest or selected version.",
            examples: ["upgrade", "upgrade 6.2.0", "upgrade 0.0.0-unstable.abc --disable-semver"],
            params: [
                {
                    name: "target",
                    description:
                        "Target version to upgrade to. Can be a specific version (e.g. 6.2.0) or 'latest' to upgrade to the latest version.",
                    type: "string",
                    default: "latest",
                    required: false
                }
            ],
            options: [
                {
                    name: "skip-checks",
                    description: "Do not perform CLI version and Git tree checks.",
                    type: "boolean",
                    default: false
                },
                {
                    name: "log-level",
                    default: "info",
                    description: `Set log level for the upgrade process executed by npx. Possible values are "debug", "info", "warning", and "error".`,
                    type: "string"
                },
                {
                    name: "show-logs",
                    default: false,
                    description: `Show logs from the upgrade process executed by npx.`,
                    type: "boolean"
                },
                {
                    name: "show-stack-trace",
                    default: false,
                    description: `Show stack trace if the upgrade process executed by npx fails.`,
                    type: "boolean"
                },
                {
                    name: "registry",
                    type: "string",
                    default: "",
                    description: "registry URL"
                },
                {
                    name: "package-manager",
                    type: "string",
                    default: "",
                    description:
                        "Package manager to use: yarn, pnpm, or npm (auto-detected from lock file if omitted)"
                },
                {
                    name: "skip-dependency-guard",
                    default: false,
                    description: `Skip the dependency guard that checks for incompatible dependencies before performing the upgrade.`,
                    type: "boolean"
                },
                {
                    name: "install-version",
                    type: "string",
                    default: "",
                    description:
                        "Install a specific version of Webiny, no matter the version upgrade script is running for. Eg. upgrade script is for 6.5.0 but you want to install 6.5.0-rc.0"
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
                    packageManager: params.packageManager || undefined,
                    registry: params.registry || undefined,
                    installVersion: params.installVersion || undefined,
                    skipDependencyGuard: params.skipDependencyGuard || false,
                    version
                });
            }
        };
    }

    private getVersion(params: UpgradeCommandParams): UpgradeCommandHandler.Version {
        const version = semver.valid(params._[1]) ? params._[1] : params.target;
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

export const UpgradeCommand = CliCommandFactory.createImplementation({
    implementation: UpgradeCommandImpl,
    dependencies: [UiService, UpgradeCommandHandler]
});
