import type { IDependencyTree } from "~/types";
import { DependencyTree } from "./DependencyTree";
import type { PackageJson } from "type-fest";
import loadJsonFile from "load-json-file";

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
                const json = loadJsonFile.sync<PackageJson>(file);
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
