import loadJson from "load-json-file";
import { PackageJson } from "type-fest";
import path from "path";
import fs from "fs-extra";

export class WebinyPackage {
    paths: {
        rootFolder: string;
        srcFolder: string;
        distFolder: string;
        packageJsonFile: string;
    };

    packageJson: PackageJson | null = null;

    constructor(packageRootFolderPath: string) {
        this.paths = {
            rootFolder: packageRootFolderPath,
            packageJsonFile: path.join(packageRootFolderPath, "package.json"),
            srcFolder: path.join(packageRootFolderPath, "src"),
            distFolder: path.join(packageRootFolderPath, "dist")
        };

        const isBuildable = fs.existsSync(path.join(this.paths.srcFolder));
        if (!isBuildable) {
            this.paths.srcFolder = packageRootFolderPath;
            this.paths.distFolder = packageRootFolderPath;
        }
    }

    getPackageJson() {
        if (this.packageJson) {
            return this.packageJson;
        }

        this.packageJson = loadJson.sync<PackageJson>(this.paths.packageJsonFile);
        return this.packageJson;
    }

    isBuildablePackage() {
        return fs.existsSync(path.join(this.paths.rootFolder, "src"));
    }

    getPublishDirectory() {
        return this.isBuildablePackage() ? this.paths.distFolder : this.paths.rootFolder;
    }

    isPrivate() {
        const packageJson = this.getPackageJson();
        return packageJson.private === true;
    }
}
