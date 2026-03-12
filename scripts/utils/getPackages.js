import readJson from "read-json-sync";
import getYarnWorkspaces from "get-yarn-workspaces";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { glob } from "glob";

const { yellow } = chalk;
const { join, basename } = path;

export const PROJECT_ROOT = join(import.meta.dirname || __dirname, "..", "..");
export const rootPackageJson = readJson(join(PROJECT_ROOT, "package.json"));

let packagesCache;

const isFolder = p => fs.statSync(p).isDirectory();
const hasPackageJson = p => fs.existsSync(p + "/package.json");

export const getPackages = (args = {}) => {
    if (packagesCache) {
        return packagesCache;
    }

    packagesCache = getYarnWorkspaces()
        .filter(isFolder)
        .filter(hasPackageJson)
        .map(path => {
            if (args.includes) {
                if (!args.includes.some(p => path.includes(p))) {
                    return null;
                }
            }

            const packageJsonPath = path + "/package.json";
            const tsConfigJsonPath = path + "/tsconfig.json";
            const tsConfigBuildJsonPath = path + "/tsconfig.build.json";

            let tsConfigJson, tsConfigBuildJson;
            const packageJson = readJson(packageJsonPath);

            try {
                tsConfigJson = readJson(tsConfigJsonPath);
            } catch {
                if (fs.existsSync(tsConfigJsonPath)) {
                    console.log(
                        yellow(
                            `Error occurred while trying to read ${tsConfigJsonPath}. File exists, but it seems there might be a syntax error in the file.`
                        )
                    );
                }
            }

            try {
                tsConfigBuildJson = readJson(tsConfigBuildJsonPath);
            } catch {
                if (fs.existsSync(tsConfigBuildJsonPath)) {
                    console.log(
                        yellow(
                            `Error occurred while trying to read ${tsConfigBuildJsonPath}. File exists, but it seems there might be a syntax error in the file.`
                        )
                    );
                }
            }

            let hasWebinyConfig = fs.existsSync(path + "/webiny.config.ts");
            if (!hasWebinyConfig) {
                // Check if there's a `webiny.config.js` file, but only if `webiny.config.ts` does not exist.
                hasWebinyConfig = fs.existsSync(path + "/webiny.config.js");
            }

            const hasTypescriptInDeps =
                packageJson.devDependencies && Boolean(packageJson.devDependencies["typescript"]);

            const testsFolderPath = path + "/__tests__";
            let hasTests = false;
            if (fs.existsSync(testsFolderPath)) {
                const files = glob.sync(`${testsFolderPath}/**/**.test.ts`);
                hasTests = Array.isArray(files) && files.length;
            }

            try {
                return {
                    isTs: Boolean(tsConfigJson || tsConfigBuildJson || hasTypescriptInDeps),
                    mustBuild: Boolean(hasWebinyConfig),
                    hasTests,
                    name: packageJson.name,
                    folderName: basename(path),
                    packageFolder: path,
                    packageFolderRelativePath: path.replace(`${PROJECT_ROOT}/`, ""),
                    packageJsonPath,
                    tsConfigJsonPath,
                    tsConfigBuildJsonPath,
                    packageJson,
                    tsConfigJson,
                    tsConfigBuildJson
                };
            } catch {
                console.log(yellow(`Ignoring ${path}/package.json`));
                return null;
            }
        })
        .filter(Boolean);

    return packagesCache;
};

export const getPackage = nameOrPackageFolder => {
    return getPackages().find(
        item =>
            item.packageJson.name === nameOrPackageFolder ||
            item.packageFolder === nameOrPackageFolder
    );
};
