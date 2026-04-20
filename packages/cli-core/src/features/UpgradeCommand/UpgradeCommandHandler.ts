import { UpgradeCommandHandler as UpgradeCommandHandlerAbstraction } from "./abstraction.js";
import chalk from "chalk";
import execa from "execa";
import { UiService } from "~/abstractions/index.js";

const GITHUB_REPOSITORY_URL = "https://github.com/webiny/webiny-upgrades-v6";

type LogType = "debug" | "success" | "warning" | "warn" | "error" | "fatal" | "done" | "info";

interface IUpgradeLine {
    type: LogType;
    message: string;
    data?: {
        stack?: string;
        [key: string]: any;
    };
}

interface IOutputOptions {
    debug: boolean;
    logLevel: string;
}

export class UpgradeCommandHandlerImpl implements UpgradeCommandHandlerAbstraction.Interface {
    public constructor(private ui: UiService.Interface) {}

    public async handle(params: UpgradeCommandHandlerAbstraction.Params): Promise<void> {
        const { version, skipChecks, debug, logLevel, showLogs, showStackTrace, installVersion } =
            params;

        if (!skipChecks) {
            /**
             * Before doing any upgrading, there must not be any active changes in the current branch.
             */
            let gitStatus = "";
            try {
                const { stdout } = execa.sync("git", ["status", "--porcelain"]);
                gitStatus = stdout.trim();
            } catch {}

            if (gitStatus) {
                this.ui.error(
                    chalk.red("This git repository has untracked files or uncommitted changes:") +
                        "\n\n" +
                        gitStatus
                            .split("\n")
                            .map(line => {
                                const matched = line.match(/ .*/g);
                                if (!matched || !matched[0]) {
                                    return "";
                                }
                                return matched[0].trim();
                            })
                            .join("\n") +
                        "\n\n" +
                        chalk.red(
                            "Remove untracked files, stash or commit any changes, and try again."
                        )
                );
                process.exit(1);
            }
        }

        const command = [
            GITHUB_REPOSITORY_URL,
            version || undefined,
            debug ? "--debug" : "",
            showLogs ? `--showLogs=${showLogs}` : "",
            showStackTrace ? `--showStackTrace=${showStackTrace}` : "",
            logLevel ? `--logLevel=${logLevel}` : "",
            installVersion ? `--installVersion=${installVersion}` : "",
            "--json"
        ].filter(Boolean);

        const npx = execa("npx", command, {
            env: {
                // TODO determine if this actually works
                // @ts-expect-error
                FORCE_COLOR: true
            },
            stdin: process.stdin
        });

        npx.stdout!.on("data", data => {
            const lines = data.toString().replace(/\n$/, "").split("\n") as string[];
            for (const line of lines) {
                if (!line || !line.trim()) {
                    continue;
                }
                this.output(line, {
                    debug,
                    logLevel
                });
            }
        });

        npx.stderr!.on("data", data => {
            this.ui.error(data.toString());
        });

        try {
            await npx;
        } catch (ex) {
            this.ui.error(`Upgrade process failed: ${ex.message}`);
        }
    }

    private output(line: string, options: IOutputOptions): void {
        const { debug, logLevel } = options;
        try {
            const json = JSON.parse(line) as IUpgradeLine;
            switch (json.type) {
                case "debug":
                    if (!debug && logLevel !== "debug") {
                        return;
                    }
                    this.ui.debug(json.message);
                    if (!json.data?.stack) {
                        return;
                    }
                    this.ui.debug(json.data?.stack);
                    break;
                case "info":
                    this.ui.info(json.message);
                    break;
                case "success":
                case "done":
                    this.ui.success(json.message);
                    break;
                case "warning":
                case "warn":
                    this.ui.warning(json.message);
                    break;
                case "error":
                case "fatal":
                    this.ui.error(json.message);
                    if (!json.data?.stack) {
                        return;
                    }
                    this.ui.debug(json.data?.stack);
                    break;
                default:
                    console.log(json);
            }
        } catch {
            // Not JSON, let's just print the line then, if its debug mode on.
            if (!debug && logLevel !== "debug") {
                return;
            }
            console.log(line);
        }
    }
}

export const UpgradeCommandHandler = UpgradeCommandHandlerAbstraction.createImplementation({
    implementation: UpgradeCommandHandlerImpl,
    dependencies: [UiService]
});
