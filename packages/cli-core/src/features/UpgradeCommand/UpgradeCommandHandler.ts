import { UpgradeCommandHandler as UpgradeCommandHandlerAbstraction } from "./abstraction.js";

import chalk from "chalk";
import execa from "execa";
import { UiService } from "~/abstractions/index.js";

const GITHUB_REPOSITORY_URL = "https://github.com/webiny/webiny-upgrades-v6";

export class UpgradeCommandHandlerImpl implements UpgradeCommandHandlerAbstraction.Interface {
    public constructor(private ui: UiService.Interface) {}

    public async handle(params: UpgradeCommandHandlerAbstraction.Params): Promise<void> {
        const { version, skipChecks, debug } = params;

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

        const command = [GITHUB_REPOSITORY_URL, version || undefined].filter(Boolean);

        const npx = execa("npx", command, {
            env: {
                // TODO determine if this actually works
                // @ts-expect-error
                FORCE_COLOR: true
            },
            stdin: process.stdin
        });
        if (!npx.stdout || !npx.stderr) {
            try {
                npx.disconnect();
                npx.cancel();
            } catch {
                // Ignore any errors that may occur during cleanup.
            }
            throw new Error("Failed to execute the upgrade command.");
        }

        npx.stdout.on("data", data => {
            const lines = data.toString().replace(/\n$/, "").split("\n") as string[];
            for (const line of lines) {
                try {
                    const json = JSON.parse(line);
                    if (json.type === "error") {
                        this.ui.error("An error occurred while performing the upgrade.");
                        console.log(json.message);
                        if (debug) {
                            this.ui.debug(json.data.stack);
                        }
                    }
                } catch {
                    // Not JSON, let's just print the line then.
                    console.log(line);
                }
            }
        });

        npx.stderr.on("data", data => {
            console.log(data.toString());
        });

        await npx;
    }
}

export const UpgradeCommandHandler = UpgradeCommandHandlerAbstraction.createImplementation({
    implementation: UpgradeCommandHandlerImpl,
    dependencies: [UiService]
});
