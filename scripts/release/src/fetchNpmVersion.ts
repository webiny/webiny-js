import pRetry, { AbortError } from "p-retry";
import { execa } from "execa";

/**
 * Prerelease versions are worked out by reading one package's dist-tags off the registry and
 * incrementing its prerelease suffix. Every package in the monorepo is published in lockstep on
 * the same version, so any published package can act as the anchor, but it has to be one that
 * still exists.
 *
 * "@webiny/cli" used to be the anchor. It was dropped from the monorepo in #5368, so its
 * dist-tags froze at 6.4.x, and every alpha release after that recomputed "-alpha.0" and
 * collided with versions already on NPM. Two things now catch a repeat: the test in
 * __tests__/fetchNpmVersion.test.ts fails if this package stops being published from here, and a
 * 404 from the registry aborts the release instead of quietly rewinding the version.
 */
export const ANCHOR_PACKAGE = "webiny";

export async function fetchNpmDistTags(
    retryOptions: { retries?: number; minTimeout?: number } = {}
): Promise<Record<string, string>> {
    const { stdout: npmRegistry } = await execa("npm", ["config", "get", "registry"]);
    const registryUrl = npmRegistry.replace(/\/$/, "");
    const url = `${registryUrl}/${ANCHOR_PACKAGE}`;

    const getDistTags = async () => {
        const res = await fetch(url);

        // An unpublished anchor is the failure mode this function exists to catch, and no amount
        // of retrying will fix it. Say so instead of burning five attempts on a 404.
        if (res.status === 404) {
            throw new AbortError(
                `Version anchor package "${ANCHOR_PACKAGE}" is not published on ${registryUrl}, ` +
                    `so there is no previous version to derive this release from. Point ` +
                    `ANCHOR_PACKAGE in scripts/release/src/fetchNpmVersion.ts at a package this ` +
                    `repo still publishes.`
            );
        }

        if (!res.ok) {
            throw Error(`Registry answered ${res.status} ${res.statusText} for ${url}.`);
        }

        const json = (await res.json()) as { "dist-tags"?: Record<string, string> };
        const distTags = json["dist-tags"];

        if (!distTags) {
            throw Error(`Registry returned no "dist-tags" for "${ANCHOR_PACKAGE}".`);
        }

        return distTags;
    };

    return pRetry(getDistTags, { retries: 5, ...retryOptions });
}
