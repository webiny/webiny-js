#!/usr/bin/env node
import { resolve, join, dirname, relative } from "path";
import { getPackage, getPackages, PROJECT_ROOT } from "./utils/getPackages.js";
import chalk from "chalk";

const { cyan, gray, green, red, yellow } = chalk;

interface PackageNode {
    name: string;
    folder: string;
    packageJsonDeps: string[];
    tsConfigRefDeps: string[];
}

type Graph = Map<string, string[]>;

const buildGraph = (): Map<string, PackageNode> => {
    const packages = getPackages({ includes: ["/packages/"] });
    const nodes = new Map<string, PackageNode>();

    for (const pkg of packages) {
        const name = pkg.packageJson.name;
        const allDeps = Object.keys({
            ...pkg.packageJson.dependencies,
            ...pkg.packageJson.devDependencies
            // ...pkg.packageJson.peerDependencies
        }).filter(dep => getPackage(dep));

        const tsConfigRefDeps: string[] = [];
        const tsConfig = pkg.tsConfigBuildJson || pkg.tsConfigJson;
        if (tsConfig?.references) {
            for (const ref of tsConfig.references) {
                const refPath = resolve(join(pkg.packageFolder, dirname(ref.path))).replace(
                    /\\/g,
                    "/"
                );

                const refPkg = getPackage(refPath);
                if (refPkg) {
                    tsConfigRefDeps.push(refPkg.packageJson.name);
                }
            }
        }

        nodes.set(name, {
            name,
            folder: relative(PROJECT_ROOT, pkg.packageFolder),
            packageJsonDeps: allDeps,
            tsConfigRefDeps
        });
    }

    return nodes;
};

const findCycles = (graph: Graph): string[][] => {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const inStack = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string) => {
        visited.add(node);
        inStack.add(node);
        path.push(node);

        const neighbors = graph.get(node) || [];
        for (const neighbor of neighbors) {
            if (!graph.has(neighbor)) {
                continue;
            }

            if (!visited.has(neighbor)) {
                dfs(neighbor);
            } else if (inStack.has(neighbor)) {
                const cycleStart = path.indexOf(neighbor);
                const cycle = path.slice(cycleStart);
                cycles.push([...cycle, neighbor]);
            }
        }

        path.pop();
        inStack.delete(node);
    };

    for (const node of graph.keys()) {
        if (!visited.has(node)) {
            dfs(node);
        }
    }

    return cycles;
};

const deduplicateCycles = (cycles: string[][]): string[][] => {
    const seen = new Set<string>();
    const unique: string[][] = [];

    for (const cycle of cycles) {
        const members = cycle.slice(0, -1);
        const key = [...members].sort().join(" -> ");
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(cycle);
        }
    }

    return unique;
};

const formatCycle = (cycle: string[], nodes: Map<string, PackageNode>): string => {
    return cycle
        .map(name => {
            const node = nodes.get(name);
            const folder = node ? gray(`(${node.folder})`) : "";
            return `${cyan(name)} ${folder}`;
        })
        .join(red(" -> "));
};

const run = () => {
    console.log();
    console.log(gray("Scanning workspace packages for circular dependencies..."));
    console.log();

    const nodes = buildGraph();

    const packageJsonGraph: Graph = new Map();
    const tsConfigGraph: Graph = new Map();

    for (const [name, node] of nodes) {
        packageJsonGraph.set(name, node.packageJsonDeps);
        tsConfigGraph.set(name, node.tsConfigRefDeps);
    }

    let totalCycles = 0;

    const packageJsonCycles = deduplicateCycles(findCycles(packageJsonGraph));
    if (packageJsonCycles.length > 0) {
        console.log(
            red(`Found ${packageJsonCycles.length} circular dependency chain(s) in package.json:`)
        );
        console.log();
        for (const cycle of packageJsonCycles) {
            totalCycles++;
            console.log(`  ${totalCycles}. ${formatCycle(cycle, nodes)}`);
        }
        console.log();
    } else {
        console.log(green("No circular dependencies found in package.json."));
    }

    const tsConfigCycles = deduplicateCycles(findCycles(tsConfigGraph));
    if (tsConfigCycles.length > 0) {
        console.log(
            red(
                `Found ${tsConfigCycles.length} circular dependency chain(s) in tsconfig references:`
            )
        );
        console.log();
        for (const cycle of tsConfigCycles) {
            totalCycles++;
            console.log(`  ${totalCycles}. ${formatCycle(cycle, nodes)}`);
        }
        console.log();
    } else {
        console.log(green("No circular dependencies found in tsconfig references."));
    }

    console.log();
    if (totalCycles > 0) {
        console.log(red(`Total circular dependency chains: ${totalCycles}`));
        process.exit(1);
    } else {
        console.log(green("All clear — no circular dependencies detected."));
        process.exit(0);
    }
};

run();
