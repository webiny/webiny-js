import { loadJsonFileSync } from "load-json-file";
import { findUp } from "find-up";

export class PackageJson {
    filePath;
    json;

    static fromFile(filePath) {
        return new PackageJson(filePath, loadJsonFileSync(filePath));
    }

    static async findClosest(fromPath) {
        const closestPackageJson = await findUp("package.json", { cwd: fromPath });
        if (!closestPackageJson) {
            throw Error(`Failed to find ${fromPath}`);
        }
        return PackageJson.fromFile(closestPackageJson);
    }

    static async fromPackage(packageName, cwd) {
        const jsonPath = await findUp(`node_modules/${packageName}/package.json`, {
            cwd: cwd ?? process.cwd()
        });

        if (!jsonPath) {
            throw Error(`Failed to find package ${packageName}`);
        }

        return PackageJson.fromFile(jsonPath);
    }

    constructor(filePath, json) {
        this.filePath = filePath;
        this.json = json;
    }

    getLocation() {
        return this.filePath;
    }

    getJson() {
        return this.json;
    }
}
