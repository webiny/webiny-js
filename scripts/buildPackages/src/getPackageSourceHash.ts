import { hashFolderAsync } from "@webiny/stdlib/node";
import type { Package } from "./types";

export async function getPackageSourceHash(workspacePackage: Package) {
    const { hash } = await hashFolderAsync(workspacePackage.packageFolder, {
        excludeFolders: ["dist", "lib", "node_modules"],
        excludeFiles: ["tsconfig.build.tsbuildinfo"]
    });

    return hash;
}
