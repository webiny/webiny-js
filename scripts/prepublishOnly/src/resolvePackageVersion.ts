import findUp from "find-up";
import { sync } from "load-json-file";
import { PackageJson } from "type-fest";
import path from "path";

interface Options {
    cwd: string;
}

export const resolvePackageVersion = (packageName: string, { cwd }: Options) => {
    const searchPath = path.join("node_modules", packageName, "package.json");
    const packageJson = findUp.sync(searchPath, { cwd });
    if (packageJson) {
        const json = sync<PackageJson>(packageJson);
        return json?.version;
    }

    return undefined;
};
