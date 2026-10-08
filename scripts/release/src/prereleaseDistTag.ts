import semver from "semver";

/**
 * The dist-tag a prerelease is published under: its preid and base version, so `6.4.12-beta.6`
 * goes under `beta-6.4.12`. Every prerelease of a version shares the tag, and prereleases of two
 * versions built in parallel never move each other's. NPM rejects tags that parse as a semver
 * range, which is why the tag can't be a bare `6.4.12`.
 */
export function prereleaseDistTag(preid: string, baseVersion: string): string {
    return `${preid}-${baseVersion}`;
}

/**
 * Highest `N` among published `<baseVersion>-<preid>.N` versions, or -1 when there is none.
 */
export function highestPrereleaseNumber(
    versions: string[],
    baseVersion: string,
    preid: string
): number {
    let highest = -1;

    for (const version of versions) {
        const parsed = semver.parse(version);
        if (!parsed || `${parsed.major}.${parsed.minor}.${parsed.patch}` !== baseVersion) {
            continue;
        }

        const [id, n] = parsed.prerelease;
        if (id === preid && typeof n === "number" && n > highest) {
            highest = n;
        }
    }

    return highest;
}
