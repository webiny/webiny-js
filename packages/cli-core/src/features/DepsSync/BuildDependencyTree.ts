import type { IDependencyTree } from "./types.js";
import { DependencyTree } from "./DependencyTree.js";
import type { PackageJson } from "type-fest";
import { loadJsonFileSync } from "load-json-file";

export interface IBuildDependencyTreeParams {
    basePath: string;
    files: string[];
    ignore?: RegExp;
}

export class BuildDependencyTree {
    public build(params: IBuildDependencyTreeParams): IDependencyTree {
        const { basePath, files, ignore } = params;
        const tree = new DependencyTree();
        for (const file of files) {
            try {
                const json = loadJsonFileSync<PackageJson>(file);
                tree.push({
                    file: file.replace(basePath, ""),
                    json,
                    ignore
                });
            } catch {
                console.log(`Failed to load "${file}".`);
            }
        }
        return tree;
    }
}
