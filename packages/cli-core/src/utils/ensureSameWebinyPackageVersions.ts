import execa from "execa";
import chalk from "chalk";

const DEBUG_FLAG = "--debug";
const usingDebugFlag = process.argv.includes(DEBUG_FLAG);

const SKIP_WEBINY_VERSIONS_CHECK_FLAG = "--no-package-versions-check";
const skippingWebinyVersionsCheck = process.argv.includes(SKIP_WEBINY_VERSIONS_CHECK_FLAG);

const listWebinyPackageVersions = (): Map<string, Set<string>> => {
    const { stdout } = execa.sync("yarn", ["info", "@webiny/*", "--name-only", "--all", "--json"], {
        encoding: "utf-8"
    });

    // Each line is a JSON string, so parse them individually.
    const lines = stdout
        .trim()
        .split("\n")
        .map(line => JSON.parse(line) as string);

    const versionMap = new Map<string, Set<string>>();

    for (const entry of lines) {
        // An example entry: "@webiny/cli@npm:5.42.3".
        const match = entry.match(/^(@webiny\/[^@]+)@npm:(.+)$/);
        if (!match) {
            continue;
        }

        const [, pkg, version] = match;
        if (!versionMap.has(pkg)) {
            versionMap.set(pkg, new Set());
        }

        versionMap.get(pkg)!.add(version);
    }

    return versionMap;
};

export const ensureSameWebinyPackageVersions = (): void => {
    // Just in case, we want to allow users to skip the check.
    if (skippingWebinyVersionsCheck) {
        return;
    }

    let webinyVersions: Map<string, Set<string>>;
    try {
        webinyVersions = listWebinyPackageVersions();
    } catch (e) {
        const message = ["Failed to inspect Webiny package versions."];

        if (!usingDebugFlag) {
            message.push(`For more information, try running with ${chalk.yellow(DEBUG_FLAG)}.`);
        }

        message.push("Learn more: https://webiny.link/webiny-package-versions-check");

        console.warn(chalk.yellow(message.join(" ")));
        if (usingDebugFlag) {
            console.warn(e);
        }

        console.log();
        return;
    }

    const mismatchedPackages: Array<[string, Set<string>]> = [];
    for (const [pkg, versions] of webinyVersions.entries()) {
        if (versions.size > 1) {
            mismatchedPackages.push([pkg, versions]);
        }
    }

    if (mismatchedPackages.length > 0) {
        const message = [
            "The following Webiny packages have mismatched versions:",
            "",
            ...mismatchedPackages.map(([pkg, versions]) => {
                return `‣ ${pkg}: ${Array.from(versions).join(", ")}`;
            }),
            "",
            `Please ensure all Webiny packages are using the same version. If you think this is a mistake, you can also skip this check by appending the ${chalk.red(
                SKIP_WEBINY_VERSIONS_CHECK_FLAG
            )} flag. Learn more: https://webiny.link/webiny-package-versions-check`
        ];

        console.error(chalk.red(message.join("\n")));
        process.exit(1);
    }
};
