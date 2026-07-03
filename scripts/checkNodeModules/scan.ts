import { readdir, readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { glob } from "node:fs/promises";
import type { NestedPackage, WorkspaceViolation } from "./types.js";

async function readPackageVersion(packagePath: string): Promise<string | null> {
    try {
        const raw = await readFile(join(packagePath, "package.json"), "utf-8");
        const parsed = JSON.parse(raw);
        return parsed.version ?? null;
    } catch {
        return null;
    }
}

async function listPackagesInDirectory(directory: string): Promise<string[]> {
    const entries = await readdir(directory, { withFileTypes: true });
    const packages: string[] = [];

    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue;
        }

        if (entry.name.startsWith("@")) {
            const scopedEntries = await readdir(join(directory, entry.name), {
                withFileTypes: true
            });
            for (const scopedEntry of scopedEntries) {
                if (scopedEntry.isDirectory()) {
                    packages.push(`${entry.name}/${scopedEntry.name}`);
                }
            }
        } else if (entry.name !== ".cache" && entry.name !== ".package-lock.json") {
            packages.push(entry.name);
        }
    }

    return packages;
}

async function findNestedNodeModules(
    rootNodeModules: string,
    currentPath: string,
    parentChain: string[],
    depth: number
): Promise<NestedPackage[]> {
    const results: NestedPackage[] = [];
    const packages = await listPackagesInDirectory(currentPath);

    for (const packageName of packages) {
        const packagePath = join(currentPath, packageName);
        const nestedNodeModules = join(packagePath, "node_modules");

        let hasNestedModules = false;
        try {
            await readdir(nestedNodeModules);
            hasNestedModules = true;
        } catch {
            hasNestedModules = false;
        }

        if (!hasNestedModules) {
            continue;
        }

        const nestedPackages = await listPackagesInDirectory(nestedNodeModules);
        const parentLabel = [...parentChain, packageName].join(" → ");

        for (const nestedName of nestedPackages) {
            const nestedPath = join(nestedNodeModules, nestedName);
            const version = await readPackageVersion(nestedPath);

            if (version) {
                results.push({
                    name: nestedName,
                    version,
                    parentPackage: parentLabel,
                    depth
                });
            }

            const deeperNodeModules = join(nestedPath, "node_modules");
            try {
                await readdir(deeperNodeModules);
                const deeperResults = await findNestedNodeModules(
                    rootNodeModules,
                    deeperNodeModules,
                    [...parentChain, packageName, nestedName],
                    depth + 1
                );
                results.push(...deeperResults);
            } catch {
                // no deeper nesting
            }
        }
    }

    return results;
}

export async function scanRootVersions(
    rootNodeModules: string,
    packageNames: Set<string>
): Promise<Map<string, string>> {
    const versions = new Map<string, string>();

    for (const name of packageNames) {
        const version = await readPackageVersion(join(rootNodeModules, name));
        if (version) {
            versions.set(name, version);
        }
    }

    return versions;
}

export async function scanNestedPackages(rootNodeModules: string): Promise<NestedPackage[]> {
    return findNestedNodeModules(rootNodeModules, rootNodeModules, [], 1);
}

async function resolveWorkspacePaths(rootDirectory: string, patterns: string[]): Promise<string[]> {
    const paths: string[] = [];

    for (const pattern of patterns) {
        if (pattern.includes("*")) {
            for await (const entry of glob(join(rootDirectory, pattern), {
                withFileTypes: false
            })) {
                paths.push(String(entry));
            }
        } else {
            const fullPath = join(rootDirectory, pattern);
            try {
                await access(fullPath);
                paths.push(fullPath);
            } catch {
                // workspace path doesn't exist
            }
        }
    }

    return paths;
}

export async function scanWorkspaceNodeModules(
    rootDirectory: string,
    workspacePatterns: string[]
): Promise<WorkspaceViolation[]> {
    const violations: WorkspaceViolation[] = [];
    const workspacePaths = await resolveWorkspacePaths(rootDirectory, workspacePatterns);

    for (const workspacePath of workspacePaths) {
        const nodeModulesPath = join(workspacePath, "node_modules");

        let entries: string[];
        try {
            entries = await listPackagesInDirectory(nodeModulesPath);
        } catch {
            continue;
        }

        const workspaceName = workspacePath.replace(rootDirectory + "/", "");

        for (const packageName of entries) {
            const version = await readPackageVersion(join(nodeModulesPath, packageName));
            if (version) {
                violations.push({ workspace: workspaceName, packageName, version });
            }
        }
    }

    violations.sort(
        (a, b) =>
            a.workspace.localeCompare(b.workspace) || a.packageName.localeCompare(b.packageName)
    );

    return violations;
}
