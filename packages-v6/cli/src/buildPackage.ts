import execa from "execa";
import loadJson from "load-json-file";
import { join } from "path";

interface BuildPackageParams {
    directory: string;
}

enum ModuleType {
    ESM = "esm",
    CJS = "cjs"
}

interface WebinyPackageConfig {
    moduleTypes: ModuleType[];
}

function getBabelParams(type: ModuleType): string[] {
    return [
        "src",
        "--extensions",
        ".ts,.tsx",
        "--out-dir",
        `lib/${type}`,
        "--source-maps",
        "--copy-files"
    ];
}

export async function buildPackage({ directory }: BuildPackageParams) {
    const packageJson: Record<string, unknown> = await loadJson(join(directory, "package.json"));
    if (!packageJson) {
        throw Error(`package.json not found in "${directory}"!`);
    }

    const config = packageJson["webiny"] as WebinyPackageConfig | undefined;
    const moduleTypes = config ? config.moduleTypes : [ModuleType.CJS, ModuleType.ESM];

    const promises = [];

    // Build ESM
    if (moduleTypes.includes(ModuleType.ESM)) {
        promises.push(
            execa("babel", getBabelParams(ModuleType.ESM), {
                cwd: directory,
                env: { BABEL_ENV: ModuleType.ESM }
            })
        );
    }

    // Build CJS
    if (moduleTypes.includes(ModuleType.CJS)) {
        promises.push(
            execa("babel", getBabelParams(ModuleType.CJS), {
                cwd: directory,
                env: { BABEL_ENV: ModuleType.CJS }
            })
        );
    }

    // Generate TS declarations
    promises.push(execa("ttsc", ["-p", "tsconfig.build.json"], { cwd: directory }));

    return await Promise.all(promises);
}
