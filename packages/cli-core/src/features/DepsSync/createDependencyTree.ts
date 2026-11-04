import fs from "fs";
import type { IDependencyTree } from "./types.js";
import { ListAllPackages } from "./ListAllPackages.js";
import { ListAllPackageJsonFiles } from "./ListAllPackageJsonFiles.js";
import { BuildDependencyTree } from "./BuildDependencyTree.js";
import { IProjectModel } from "@webiny/project";

export const createDependencyTree = async (project: IProjectModel): Promise<IDependencyTree> => {
    const projectRoot = project.paths.rootFolder;
    const basePath = projectRoot.toString();
    const packagesFolderPath = projectRoot.join("packages").toString();
    const packageJsonFilePath = projectRoot.join("package.json").toString();
    // The e2e tests share deps with the packages (zod, ai), so their versions are checked too.
    const e2ePackageJsonFilePath = projectRoot.join("e2e/package.json").toString();

    const listAllPackages = new ListAllPackages();
    const listAllPackageJsonFiles = new ListAllPackageJsonFiles();
    const buildDependencyTree = new BuildDependencyTree();

    const allPackages = await listAllPackages.list([packagesFolderPath]);

    const allPackageJsonFiles = listAllPackageJsonFiles.list({
        targets: allPackages
    });

    return buildDependencyTree.build({
        basePath,
        files: [
            packageJsonFilePath,
            ...(fs.existsSync(e2ePackageJsonFilePath) ? [e2ePackageJsonFilePath] : []),
            ...allPackageJsonFiles
        ],
        ignore: /^@webiny\//
    });
};
