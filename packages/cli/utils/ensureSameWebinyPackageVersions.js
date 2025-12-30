const execa = require("execa");
const logger = require("./log");

const DEBUG_FLAG = "--debug";
const usingDebugFlag = process.argv.includes(DEBUG_FLAG);

const SKIP_WBY_VERSIONS_CHECK_FLAG = "--no-package-versions-check";
const skippingWebinyVersionsCheck = process.argv.includes(SKIP_WBY_VERSIONS_CHECK_FLAG);

function listWebinyPackageVersions() {
    const { stdout } = execa.sync("yarn", ["info", "@webiny/*", "--name-only", "--all", "--json"], {
        encoding: "utf-8"
    });

    // Each line is a JSON string, so parse them individually
    const lines = stdout
        .trim()
        .split("\n")
        .map(line => JSON.parse(line));

    const versionMap = new Map();

    for (const entry of lines) {
        // An example entry: "@webiny/cli@npm:5.42.3"
        const match = entry.match(/^(@webiny\/[^@]+)@npm:(.+)$/);
        if (!match) {
            continue;
        }

        const [, pkg, version] = match;
        if (!versionMap.has(pkg)) {
            versionMap.set(pkg, new Set());
        }

        versionMap.get(pkg).add(version);
    }

    return versionMap;
}

function ensureSameWebinyPackageVersions() {
    // Just in case, we want to allow users to skip the check.
    if (skippingWebinyVersionsCheck) {
        return;
    }

    let webinyVersions;
    try {
        webinyVersions = listWebinyPackageVersions();
    } catch (e) {
        const message = ["Failed to inspect Webiny package versions."];

        if (!usingDebugFlag) {
            message.push(
                `For more information, try running with ${logger.warning.hl(DEBUG_FLAG)}.`
            );
        }

        message.push("Learn more: https://webiny.link/webiny-package-versions-check");

        logger.warning(message.join(" "));
        if (usingDebugFlag) {
            logger.debug(e);
        }

        console.log();
        return;
    }

    let hasMismatch = false;
    const mismatchedPackages = [];
    for (const [pkg, versions] of webinyVersions.entries()) {
        if (versions.size > 1) {
            hasMismatch = true;
            mismatchedPackages.push([pkg, versions]);
        }
    }

    if (hasMismatch) {
        const message = [
            "The following Webiny packages have mismatched versions:",
            "",
            ...mismatchedPackages.map(([pkg, versions]) => {
                return `‣ ${pkg}: ${Array.from(versions).join(", ")}`;
            }),
            "",
            `Please ensure all Webiny packages are using the same version. If you think this is a mistake, you can also skip this check by appending the ${logger.error.hl(
                SKIP_WBY_VERSIONS_CHECK_FLAG
            )} flag. Learn more: https://webiny.link/webiny-package-versions-check`
        ];

        logger.error(message.join("\n"));
        process.exit(1);
    }
}

module.exports = {
    ensureSameWebinyPackageVersions
};
