import type { NestedPackage, DuplicateGroup } from "./types.js";

export function groupDuplicates(
    nestedPackages: NestedPackage[],
    rootVersions: Map<string, string>
): DuplicateGroup[] {
    const byPackageName = new Map<string, Map<string, string[]>>();

    for (const nested of nestedPackages) {
        if (!byPackageName.has(nested.name)) {
            byPackageName.set(nested.name, new Map());
        }

        const versionMap = byPackageName.get(nested.name)!;

        if (!versionMap.has(nested.version)) {
            versionMap.set(nested.version, []);
        }

        versionMap.get(nested.version)!.push(nested.parentPackage);
    }

    const groups: DuplicateGroup[] = [];

    for (const [packageName, versionMap] of byPackageName) {
        const rootVersion = rootVersions.get(packageName) ?? null;
        const nested: DuplicateGroup["nested"] = [];

        for (const [version, parents] of versionMap) {
            nested.push({
                version,
                parents: parents.sort()
            });
        }

        nested.sort((a, b) => a.version.localeCompare(b.version));

        groups.push({ packageName, rootVersion, nested });
    }

    groups.sort((a, b) => a.packageName.localeCompare(b.packageName));

    return groups;
}
