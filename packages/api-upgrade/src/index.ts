import { UpgradePlugin } from "~/types";
import WebinyError from "@webiny/error";
import { gt, lt, coerce } from "semver";

export enum ErrorCode {
    UPGRADE_VERSION_MISMATCH = "UPGRADE_VERSION_MISMATCH",
    VERSION_ALREADY_INSTALLED = "VERSION_ALREADY_INSTALLED",
    SKIPPING_UPGRADES_NOT_ALLOWED = "SKIPPING_UPGRADES_NOT_ALLOWED",
    UPGRADE_NOT_AVAILABLE = "UPGRADE_NOT_AVAILABLE"
}

interface RunUpgradeArgs {
    /**
     * Version of Webiny that is currently deployed (context.WEBINY_VERSION).
     */
    deployedVersion: string;
    /**
     * Version you want to upgrade to, eg: 5.1.0
     */
    upgradeToVersion: string;
    /**
     * App version that is currently installed (this usually comes from DB and each app tracks this independently).
     * Note that this does not have to match the `deployedVersion`. The `installedAppVersion` will tell you which
     * version of Webiny was running at the time of installing/upgrading the app.
     */
    installedAppVersion: string | null;
    /**
     * A collection of upgrade plugins you want to check for an applicable plugin. Make sure you only pass plugins
     * that belong to the app you're upgrading. For example: if upgrading `file-manager`, make sure you exclude
     * all other upgrade plugins.
     */
    upgradePlugins: UpgradePlugin[];
}
export function getApplicablePlugin(args: RunUpgradeArgs): UpgradePlugin {
    const { upgradePlugins, installedAppVersion, upgradeToVersion } = args;
    const semverResult = coerce(args.deployedVersion);

    const deployedVersion = semverResult?.version;

    if (upgradeToVersion !== deployedVersion) {
        throw new WebinyError(
            `The requested upgrade version does not match the deployed version.`,
            ErrorCode.UPGRADE_VERSION_MISMATCH,
            {
                deployedVersion: deployedVersion,
                requestedUpgradeTo: upgradeToVersion
            }
        );
    }

    if (installedAppVersion === upgradeToVersion) {
        throw new WebinyError(
            `Version ${upgradeToVersion} is already installed!`,
            ErrorCode.VERSION_ALREADY_INSTALLED
        );
    }

    const upgrades = upgradePlugins.filter(pl => {
        return (
            installedAppVersion &&
            lt(pl.version, deployedVersion) &&
            gt(pl.version, installedAppVersion)
        );
    });

    if (upgrades.length > 0) {
        throw new WebinyError(
            `Skipping of upgrades is not allowed: https://docs.webiny.com/docs/how-to-guides/upgrade-webiny`,
            ErrorCode.SKIPPING_UPGRADES_NOT_ALLOWED,
            {
                deployedVersion: deployedVersion,
                skippedVersions: upgrades.map(pl => pl.version),
                installedAppVersion
            }
        );
    }

    const upgrade = upgradePlugins.find(pl => pl.version === upgradeToVersion);

    if (!upgrade) {
        throw new WebinyError(
            `Upgrade to version ${upgradeToVersion} is not available.`,
            ErrorCode.UPGRADE_NOT_AVAILABLE
        );
    }

    return upgrade;
}

export { UpgradePlugin };
