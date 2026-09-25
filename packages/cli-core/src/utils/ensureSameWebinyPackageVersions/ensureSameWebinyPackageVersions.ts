import chalk from "chalk";
import { getCacheFilePath } from "./getCacheFilePath.js";
import { hashYarnLock } from "./hashYarnLock.js";
import { listWebinyPackageVersions } from "./listWebinyPackageVersions.js";
import { readClearedYarnLockHash } from "./readClearedYarnLockHash.js";
import { writeClearedYarnLockHash } from "./writeClearedYarnLockHash.js";

const DEBUG_FLAG = "--debug";
const usingDebugFlag = process.argv.includes(DEBUG_FLAG);

const SKIP_WEBINY_VERSIONS_CHECK_FLAG = "--no-package-versions-check";
const skippingWebinyVersionsCheck = process.argv.includes(SKIP_WEBINY_VERSIONS_CHECK_FLAG);

/*
 * Two `@webiny/*` packages on different versions in one install produce failures that are hard to
 * read, so the CLI refuses to start on a mismatch. The check runs on every invocation and the `yarn
 * info` call behind it is slow, so a pass is remembered against the lockfile hash and skipped while
 * that hash holds.
 *
 * Only a pass is cached. A failed `yarn info` warns and returns, and a mismatch exits, so neither
 * writes the file and the next run checks again.
 */
export const ensureSameWebinyPackageVersions = (): void => {
    // Just in case, we want to allow users to skip the check.
    if (skippingWebinyVersionsCheck) {
        return;
    }

    const cacheFilePath = getCacheFilePath();
    const yarnLockHash = hashYarnLock();

    if (cacheFilePath && yarnLockHash) {
        const clearedYarnLockHash = readClearedYarnLockHash(cacheFilePath);
        if (clearedYarnLockHash === yarnLockHash) {
            return;
        }
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

    if (cacheFilePath && yarnLockHash) {
        writeClearedYarnLockHash(cacheFilePath, yarnLockHash);
    }
};
