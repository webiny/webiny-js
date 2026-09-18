import { execaSync } from "execa";

/*
 * Asks yarn which versions of each Webiny package the install resolved to, keyed by package name.
 * More than one version in a set is the mismatch the check is looking for.
 *
 * Both patterns are needed. `@webiny/*` covers the scoped packages, and `webiny` covers the unscoped
 * umbrella package, which is the one a generated project actually depends on: `template.package.json`
 * ships `webiny` and `@webiny/mcp` and nothing else. A scoped-only glob leaves the single most
 * important package in a user's project out of the comparison.
 *
 * This is the expensive call the cache exists to avoid: `yarn info --all` takes the better part of a
 * second in a project of any size.
 */
export const listWebinyPackageVersions = (): Map<string, Set<string>> => {
    const patterns = ["@webiny/*", "webiny"];
    const args = ["info", ...patterns, "--name-only", "--all", "--json"];

    const { stdout } = execaSync("yarn", args, {
        encoding: "utf8"
    });

    // Each line is a JSON string, so parse them individually.
    const lines = stdout
        .trim()
        .split("\n")
        .map(line => JSON.parse(line) as string);

    const versionMap = new Map<string, Set<string>>();

    for (const entry of lines) {
        // Example entries: "@webiny/cli@npm:5.42.3" and "webiny@npm:5.42.3". Anything resolved to
        // something other than npm, a workspace in this repo for instance, has no version to compare.
        const match = entry.match(/^(webiny|@webiny\/[^@]+)@npm:(.+)$/);
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
