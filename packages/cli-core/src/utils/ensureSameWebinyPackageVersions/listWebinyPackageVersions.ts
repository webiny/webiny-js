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
 * `--recursive` is what makes this work outside this monorepo. `--all` on its own reports only the
 * direct dependencies of the workspaces, and in a generated project the only direct Webiny
 * dependencies are `webiny` and `@webiny/mcp`; every scoped package is transitive underneath them.
 * Without it the check would compare two packages and call that a pass. It costs nothing measurable,
 * and in this repo the two flags return the same set because every package here is a workspace.
 *
 * This is the expensive call the cache exists to avoid: it takes the better part of a second in a
 * project of any size.
 */
export const listWebinyPackageVersions = (): Map<string, Set<string>> => {
    const patterns = ["@webiny/*", "webiny"];
    const args = ["info", ...patterns, "--name-only", "--all", "--recursive", "--json"];

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
