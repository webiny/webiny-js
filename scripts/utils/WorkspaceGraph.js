import path from "node:path";
import fs from "fs-extra";
import { loadJsonFileSync } from "load-json-file";
import { PROJECT_ROOT } from "./getPackages.js";

export class WorkspaceGraph {
    /**
     * @private
     */
    packages = new Map();
    /**
     * @private
     */
    graph = new Map();
    /**
     * @private
     */
    sorted = null;

    constructor(options = {}) {
        const globs = options.patterns || ["packages/*"];
        const ignore = new Set(options.ignore || []);

        for (const glob of globs) {
            const baseDir = path.join(PROJECT_ROOT, glob.replace("/*", ""));
            if (!fs.existsSync(baseDir)) {
                continue;
            }

            const entries = fs.readdirSync(baseDir, { withFileTypes: true });
            for (const entry of entries) {
                if (!entry.isDirectory()) {
                    continue;
                }

                const pkgJsonPath = path.join(baseDir, entry.name, "package.json");
                if (!fs.existsSync(pkgJsonPath)) {
                    continue;
                }

                const pkgJson = loadJsonFileSync(pkgJsonPath);
                if (ignore.has(pkgJson.name)) {
                    continue;
                }

                this.packages.set(pkgJson.name, pkgJson);
            }
        }

        this.buildGraph();
    }

    /**
     * @private
     */
    buildGraph() {
        const packageNames = new Set(this.packages.keys());

        for (const [name, pkgJson] of this.packages) {
            const internalDeps = [];
            const allDeps = {
                ...pkgJson.dependencies,
                ...pkgJson.devDependencies
            };

            for (const dep of Object.keys(allDeps)) {
                if (packageNames.has(dep)) {
                    internalDeps.push(dep);
                }
            }

            this.graph.set(name, internalDeps);
        }
    }

    toposort() {
        if (this.sorted) {
            return this.sorted;
        }

        const inDegree = new Map();
        const dependents = new Map();

        for (const name of this.graph.keys()) {
            inDegree.set(name, 0);
            dependents.set(name, []);
        }

        for (const [name, deps] of this.graph) {
            for (const dep of deps) {
                if (this.graph.has(dep)) {
                    inDegree.set(name, inDegree.get(name) + 1);
                    dependents.get(dep).push(name);
                }
            }
        }

        const queue = [];
        for (const [name, degree] of inDegree) {
            if (degree === 0) {
                queue.push(name);
            }
        }

        const order = [];
        const emitted = new Set();

        while (emitted.size < this.graph.size) {
            if (queue.length === 0) {
                let best = null;
                for (const [name, degree] of inDegree) {
                    if (emitted.has(name)) {
                        continue;
                    }
                    if (best === null || degree < inDegree.get(best)) {
                        best = name;
                    }
                }
                queue.push(best);
            }

            queue.sort();

            const wave = [...queue];
            queue.length = 0;

            for (const name of wave) {
                if (emitted.has(name)) {
                    continue;
                }
                emitted.add(name);
                order.push(name);

                for (const dependent of dependents.get(name)) {
                    const newDegree = inDegree.get(dependent) - 1;
                    inDegree.set(dependent, newDegree);
                    if (newDegree === 0) {
                        queue.push(dependent);
                    }
                }
            }
        }

        const result = {};
        for (const name of order) {
            result[name] = this.graph.get(name);
        }

        this.sorted = result;
        return result;
    }
}
