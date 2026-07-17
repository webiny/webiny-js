import { createHash } from "node:crypto";
import path from "node:path";
import fs from "fs-extra";
import { load as loadYaml } from "js-yaml";
import { WorkspaceGraph } from "../../utils/WorkspaceGraph.js";
import { PROJECT_ROOT } from "../../utils/getPackages.js";
import { getPackageSourceHash } from "./getPackageSourceHash";
import type { Package } from "./types";

/**
 * Whether the experimental dependency-aware build key is enabled. OFF by
 * default: the build key is each package's own-source hash (original behavior),
 * and `--rebuild-dependents` remains the mechanism for rebuilding dependents.
 *
 * Enable with `WEBINY_EXPERIMENTAL_DEP_AWARE_CACHE=true` (or `1`) to make a
 * plain `yarn build` rebuild dependents of any changed package automatically.
 */
export function isDepAwareKeyEnabled(): boolean {
    const value = process.env.WEBINY_EXPERIMENTAL_DEP_AWARE_CACHE;
    return value === "true" || value === "1";
}

/**
 * Own-source hash per package (no dependency folding) — the original,
 * non-dependency-aware build key. Used when the experimental key is disabled.
 */
export async function getOwnHashes(allPackages: Package[]): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    await Promise.all(
        allPackages.map(async pkg => {
            map.set(pkg.name, await getPackageSourceHash(pkg));
        })
    );
    return map;
}

/**
 * Parses `yarn.lock` into a map of dependency descriptor → a token that changes
 * whenever the *resolved* package changes (its checksum, falling back to
 * resolution/version). Lets a package's key reflect not just the declared
 * version range (already covered by hashing its package.json) but what that
 * range actually resolves to — closing the gap where a floating range or a
 * lockfile update pulls new third-party code without any package.json edit.
 */
function buildLockResolutionMap(): Map<string, string> {
    const map = new Map<string, string>();
    const lockPath = path.join(PROJECT_ROOT, "yarn.lock");
    if (!fs.existsSync(lockPath)) {
        return map;
    }

    const doc = loadYaml(fs.readFileSync(lockPath, "utf8")) as Record<string, any> | null;
    if (!doc) {
        return map;
    }

    for (const [key, entry] of Object.entries(doc)) {
        if (key === "__metadata" || !entry) {
            continue;
        }
        const token = entry.checksum || entry.resolution || entry.version || "";
        // A single entry may cover several comma-separated descriptors.
        for (const descriptor of key.split(", ")) {
            map.set(descriptor.trim(), token);
        }
    }

    return map;
}

/**
 * Hash of a package's resolved third-party (non-workspace) dependencies. Folded
 * into its build key so a lockfile change to any of them invalidates only the
 * packages that actually depend on it — not the whole repo.
 */
function thirdPartyDepsHash(
    pkg: Package,
    workspaceNames: Set<string>,
    lockMap: Map<string, string>
): string {
    const json = pkg.packageJson || {};
    const deps: Record<string, string> = {
        ...json.dependencies,
        ...json.devDependencies
    };

    const parts: string[] = [];
    for (const [name, range] of Object.entries(deps)) {
        // Workspace deps are captured by folding their keys; skip them here.
        if (
            workspaceNames.has(name) ||
            (typeof range === "string" && range.startsWith("workspace:"))
        ) {
            continue;
        }
        const resolved = lockMap.get(`${name}@npm:${range}`) ?? String(range);
        parts.push(`${name}@${resolved}`);
    }

    parts.sort();
    return createHash("sha256").update(parts.join("\0")).digest("hex");
}

/**
 * Computes each package's *effective* build key:
 *
 *     key(pkg) = hash(own source hash + resolved third-party deps + sorted keys
 *                     of its workspace deps)
 *
 * Unlike the bare own-source hash, this changes whenever ANY (transitive)
 * workspace dependency OR any resolved third-party dependency changes — so a
 * dependent is a cache miss and gets rebuilt even when its own source is
 * untouched. Relies on the workspace dependency graph (package.json), which
 * `adio` keeps in sync with actual imports.
 *
 * Keys are computed once over the toposort (deps before dependents), so each is
 * derived exactly once. Own-source hashes are computed in parallel.
 */
export async function getEffectiveHashes(allPackages: Package[]): Promise<Map<string, string>> {
    const graph = new WorkspaceGraph({ ignore: ["@webiny/project-utils"] });
    // name -> direct workspace deps, insertion order = topological (deps first).
    const sorted = graph.toposort() as Record<string, string[]>;

    const byName = new Map(allPackages.map(pkg => [pkg.name, pkg]));
    const names = Object.keys(sorted);
    const workspaceNames = new Set(names);
    const lockMap = buildLockResolutionMap();

    // Own-source hash per package (parallel).
    const ownHashes = new Map<string, string>();
    await Promise.all(
        names.map(async name => {
            const pkg = byName.get(name);
            ownHashes.set(name, pkg ? await getPackageSourceHash(pkg) : "");
        })
    );

    // Resolved third-party dependency hash per package.
    const thirdParty = new Map<string, string>();
    for (const name of names) {
        const pkg = byName.get(name);
        thirdParty.set(name, pkg ? thirdPartyDepsHash(pkg, workspaceNames, lockMap) : "");
    }

    // Effective key per package, folding in dependency keys (topo order).
    const keys = new Map<string, string>();
    for (const name of names) {
        const depKeys = (sorted[name] || [])
            .map(dep => keys.get(dep) ?? ownHashes.get(dep) ?? "")
            .sort();

        const hash = createHash("sha256");
        hash.update(ownHashes.get(name) ?? "");
        hash.update("\0lock\0");
        hash.update(thirdParty.get(name) ?? "");
        for (const depKey of depKeys) {
            hash.update("\0");
            hash.update(depKey);
        }
        keys.set(name, hash.digest("hex"));
    }

    return keys;
}
