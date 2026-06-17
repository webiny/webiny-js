import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { scanNestedPackages, scanRootVersions, scanWorkspaceNodeModules } from "./scan.js";
import { groupDuplicates } from "./group.js";
import { formatReport, formatWorkspaceReport } from "./report.js";
import { parseArgs } from "./cli.js";

const options = parseArgs(process.argv);
const rootDirectory = process.cwd();
const rootNodeModules = resolve(rootDirectory, "node_modules");

const packageJson = JSON.parse(await readFile(resolve(rootDirectory, "package.json"), "utf-8"));
const rawWorkspaces = packageJson.workspaces ?? [];
const workspacePatterns: string[] = Array.isArray(rawWorkspaces)
    ? rawWorkspaces
    : (rawWorkspaces.packages ?? []);

const runWorkspaces = options?.nodeModulesOnly;
const runNodeModules = options?.workspacesOnly;

console.log("Scanning nested node_modules…");

let hasViolations = false;

if (runWorkspaces) {
    const workspaceViolations = await scanWorkspaceNodeModules(rootDirectory, workspacePatterns);
    console.log(formatWorkspaceReport(workspaceViolations));

    if (workspaceViolations.length > 0) {
        hasViolations = true;
    }
}

if (runNodeModules) {
    const nestedPackages = await scanNestedPackages(rootNodeModules);
    const packageNames = new Set(nestedPackages.map(nested => nested.name));
    const rootVersions = await scanRootVersions(rootNodeModules, packageNames);
    const groups = groupDuplicates(nestedPackages, rootVersions);
    console.log(formatReport(groups));

    if (groups.length > 0) {
        hasViolations = true;
    }
}

if (options.ci && hasViolations) {
    console.error(
        "\x1b[1m\x1b[31mNested node_modules detected.\x1b[0m Run \x1b[1myarn check:node-modules\x1b[0m locally to inspect the full report."
    );
    process.exit(1);
}
