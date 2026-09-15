import fs from "fs";
import path from "path";
import { loadJsonFileSync } from "load-json-file";
import pRetry, { AbortError } from "p-retry";
import { execa } from "execa";
import type { PackageJson } from "type-fest";

/**
 * Prerelease versions are worked out by reading one package's dist-tags off the registry and
 * incrementing its prerelease suffix. Every package in the monorepo is published in lockstep on
 * the same version, so any published package can act as the anchor, but it has to be one that
 * still exists.
 *
 * "@webiny/cli" used to be the anchor. It was dropped from the monorepo in #5368, so its
 * dist-tags froze at 6.4.x, and every alpha release after that recomputed "-alpha.0" and
 * collided with versions already on NPM. Reading the name off disk stops that from repeating: a
 * rename is picked up on its own, and a deletion fails the release instead of quietly rewinding
 * the version.
 */
const ANCHOR_PACKAGE_DIR = "packages/webiny";

const POINT_AT_A_PUBLISHED_PACKAGE =
    `Point ANCHOR_PACKAGE_DIR in scripts/release/src/fetchNpmVersion.ts ` +
    `at a package this repo still publishes.`;

export function getAnchorPackageName(cwd: string = process.cwd()): string {
    const pkgJsonPath = path.resolve(cwd, ANCHOR_PACKAGE_DIR, "package.json");

    if (!fs.existsSync(pkgJsonPath)) {
        throw Error(
            `Version anchor package "${ANCHOR_PACKAGE_DIR}" does not exist. Releases read the ` +
                `previous version from its NPM dist-tags. ${POINT_AT_A_PUBLISHED_PACKAGE}`
        );
    }

    const pkgJson = loadJsonFileSync<PackageJson>(pkgJsonPath);

    if (!pkgJson.name) {
        throw Error(
            `Version anchor package "${ANCHOR_PACKAGE_DIR}" has no "name" in its package.json.`
        );
    }

    if (pkgJson.private) {
        throw Error(
            `Version anchor package "${pkgJson.name}" is private, so it has no NPM dist-tags to ` +
                `read. ${POINT_AT_A_PUBLISHED_PACKAGE}`
        );
    }

    return pkgJson.name;
}

export async function fetchNpmDistTags(
    retryOptions: { retries?: number; minTimeout?: number } = {}
): Promise<Record<string, string>> {
    const { stdout: npmRegistry } = await execa("npm", ["config", "get", "registry"]);
    const registryUrl = npmRegistry.replace(/\/$/, "");
    const packageName = getAnchorPackageName();
    const url = `${registryUrl}/${packageName.replace("/", "%2f")}`;

    const getDistTags = async () => {
        const res = await fetch(url);

        // An unpublished anchor is the failure mode this whole function exists to catch, and no
        // amount of retrying will fix it. Say so instead of burning five attempts on a 404.
        if (res.status === 404) {
            throw new AbortError(
                `Version anchor package "${packageName}" is not published on ${registryUrl}, so ` +
                    `there is no previous version to derive this release from. ` +
                    POINT_AT_A_PUBLISHED_PACKAGE
            );
        }

        if (!res.ok) {
            throw Error(`Registry answered ${res.status} ${res.statusText} for ${url}.`);
        }

        const json = (await res.json()) as { "dist-tags"?: Record<string, string> };
        const distTags = json["dist-tags"];

        if (!distTags) {
            throw Error(`Registry returned no "dist-tags" for "${packageName}".`);
        }

        return distTags;
    };

    return pRetry(getDistTags, { retries: 5, ...retryOptions });
}
