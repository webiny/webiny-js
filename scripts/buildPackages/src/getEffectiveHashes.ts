import { createHash } from "node:crypto";
import { WorkspaceGraph } from "../../utils/WorkspaceGraph.js";
import { getPackageSourceHash } from "./getPackageSourceHash";
import type { Package } from "./types";

/**
 * Computes each package's *effective* build key:
 *
 *     key(pkg) = hash(own source hash + sorted keys of its workspace deps)
 *
 * Unlike the bare own-source hash, this changes whenever ANY (transitive)
 * dependency changes — so a dependent is a cache miss and gets rebuilt even
 * when its own source is untouched. Relies on the workspace dependency graph
 * (package.json), which `adio` keeps in sync with actual imports.
 *
 * Keys are computed once over the toposort (deps before dependents), so each
 * is derived exactly once. Own-source hashes are computed in parallel.
 */
export async function getEffectiveHashes(allPackages: Package[]): Promise<Map<string, string>> {
    const graph = new WorkspaceGraph({ ignore: ["@webiny/project-utils"] });
    // name -> direct workspace deps, insertion order = topological (deps first).
    const sorted = graph.toposort() as Record<string, string[]>;

    const byName = new Map(allPackages.map(pkg => [pkg.name, pkg]));
    const names = Object.keys(sorted);

    // Own-source hash per package (parallel).
    const ownHashes = new Map<string, string>();
    await Promise.all(
        names.map(async name => {
            const pkg = byName.get(name);
            ownHashes.set(name, pkg ? await getPackageSourceHash(pkg) : "");
        })
    );

    // Effective key per package, folding in dependency keys (topo order).
    const keys = new Map<string, string>();
    for (const name of names) {
        const depKeys = (sorted[name] || [])
            .map(dep => keys.get(dep) ?? ownHashes.get(dep) ?? "")
            .sort();

        const hash = createHash("sha256");
        hash.update(ownHashes.get(name) ?? "");
        for (const depKey of depKeys) {
            hash.update("\0");
            hash.update(depKey);
        }
        keys.set(name, hash.digest("hex"));
    }

    return keys;
}
