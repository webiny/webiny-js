import type { IDependencyTree } from "./types.js";
import { ListAllPackages } from "./ListAllPackages.js";
import { ListAllPackageJsonFiles } from "./ListAllPackageJsonFiles.js";
import { BuildDependencyTree } from "./BuildDependencyTree.js";
import { IProjectModel } from "@webiny/project";

export const createDependencyTree = (project: IProjectModel): IDependencyTree => {
    const projectRoot = project.paths.rootFolder;
    const basePath = projectRoot.toString();
    const packagesFolderPath = projectRoot.join("packages").toString();
    const cypressFolderPath = projectRoot.join("cypress").toString();
    const packageJsonFilePath = projectRoot.join("package.json").toString();

    const listAllPackages = new ListAllPackages();
    const listAllPackageJsonFiles = new ListAllPackageJsonFiles();
    const buildDependencyTree = new BuildDependencyTree();

    const allPackages = listAllPackages.list([packagesFolderPath, cypressFolderPath]);

    const allPackageJsonFiles = listAllPackageJsonFiles.list({
        targets: allPackages
    });

    return buildDependencyTree.build({
        basePath,
        files: [packageJsonFilePath, ...allPackageJsonFiles],
        ignore: /^@webiny\//
    });
};
