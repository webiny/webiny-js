import { loadJsonFileSync } from "load-json-file";
import { findUp } from "find-up";

export class PackageJson {
    private readonly filePath: string;
    private readonly json: Record<string, any>;

    static async fromFile(filePath: string) {
        return new PackageJson(filePath, loadJsonFileSync(filePath));
    }

    static async findClosest(fromPath: string) {
        const closestPackageJson = await findUp("package.json", { cwd: fromPath });
        return PackageJson.fromFile(closestPackageJson!);
    }

    constructor(filePath: string, json: Record<string, any>) {
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
