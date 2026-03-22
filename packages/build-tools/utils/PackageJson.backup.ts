// We'll use this class once the package is converted to TS!

import readJson from "read-json-sync";
import { findUp } from "find-up";

export class PackageJson {
    private readonly filePath: string;
    private readonly json: Record<string, any>;

    static fromFile(filePath: string) {
        return new PackageJson(filePath, readJson(filePath));
    }

    static async findClosest(fromPath: string) {
        const closestPackageJson = await findUp("package.json", { cwd: fromPath });
        if (!closestPackageJson) {
            throw Error(`Failed to find ${fromPath}`);
        }
        return PackageJson.fromFile(closestPackageJson);
    }

    static async fromPackage(packageName: string, cwd?: string) {
        const jsonPath = await findUp(`node_modules/${packageName}/package.json`, {
            cwd: cwd ?? process.cwd()
        });

        if (!jsonPath) {
            throw Error(`Failed to find package ${packageName}`);
        }

        return PackageJson.fromFile(jsonPath);
    }

    private constructor(filePath: string, json: Record<string, any>) {
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
