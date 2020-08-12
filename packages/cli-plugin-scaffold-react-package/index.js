const fs = require("fs");
const path = require("path");
const util = require("util");
const ncp = util.promisify(require("ncp").ncp);
const findUp = require("find-up");
const execa = require("execa");
const { replaceInPath } = require("replace-in-path");
const Case = require("case");
const readJson = require("load-json-file");
const writeJson = require("write-json-file");

module.exports = [
    {
        name: "cli-plugin-scaffold-template-react-package",
        type: "cli-plugin-scaffold-template",
        scaffold: {
            name: "React Package",
            questions: ({ context }) => {
                return [
                    {
                        name: "location",
                        message: "Enter package location",
                        default: "packages/my-components",
                        validate: location => {
                            if (location === "") {
                                return "Please enter a package location";
                            }

                            const fullLocation = path.resolve(location);
                            const projectLocation = context.paths.projectRoot;
                            if (!fullLocation.startsWith(projectLocation)) {
                                return "The target location must be within the Webiny project's root";
                            }

                            if (fs.existsSync(path.resolve(location))) {
                                return "The target location already exists";
                            }

                            return true;
                        }
                    },
                    {
                        name: "packageName",
                        message: "Enter package name",
                        default: ({ location }) => {
                            const parts = location.split("/");
                            return Case.kebab(parts[parts.length - 1]);
                        }
                    }
                ];
            },
            generate: async ({ input }) => {
                let { location, packageName } = input;
                location = location.split("/");
                location[location.length - 1] = Case.kebab(location[location.length - 1]);
                location = path.join(...location);
                packageName = Case.kebab(packageName);

                const fullLocation = path.resolve(location);
                const projectRootPath = path.dirname(
                    findUp.sync("webiny.root.js", {
                        cwd: fullLocation
                    })
                );

                // Then we also copy the template folder
                const sourceFolder = path.join(__dirname, "template");

                if (fs.existsSync(location)) {
                    throw new Error(`Destination folder ${location} already exists!`);
                }

                await fs.mkdirSync(location, { recursive: true });

                // Get base TS config & tsconfig.build path
                const baseTsConfigPath = path
                    .relative(
                        fullLocation,
                        findUp.sync("tsconfig.json", {
                            cwd: fullLocation
                        })
                    )
                    .replace(/\\/g, "/");
                const baseTsConfigBuildPath = path
                    .relative(
                        fullLocation,
                        findUp.sync("tsconfig.build.json", {
                            cwd: fullLocation
                        })
                    )
                    .replace(/\\/g, "/");

                // Copy template files
                await ncp(sourceFolder, location);

                // Update the package's name
                const packageJsonPath = path.resolve(location, "package.json");
                let packageJson = fs.readFileSync(packageJsonPath, "utf8");
                packageJson = packageJson.replace("[PACKAGE_NAME]", packageName);
                fs.writeFileSync(packageJsonPath, packageJson);

                // Get .babel.react.js path
                const babelReactJsPath = path
                    .relative(
                        fullLocation,
                        findUp.sync(".babel.react.js", {
                            cwd: fullLocation
                        })
                    )
                    .replace(/\\/g, "/");

                // Update .babelrc.js
                const babelrcPath = path.resolve(location, ".babelrc.js");
                let babelrc = fs.readFileSync(babelrcPath, "utf8");
                babelrc = babelrc.replace("[.BABEL.REACT_PATH]", babelReactJsPath);
                fs.writeFileSync(babelrcPath, babelrc);

                // Update tsconfig "extends" path
                const tsConfigPath = path.join(fullLocation, "tsconfig.json");
                const tsconfig = require(tsConfigPath);
                tsconfig.extends = baseTsConfigPath;
                fs.writeFileSync(tsConfigPath, JSON.stringify(tsconfig, null, 2));

                // Update tsconfig.build "extends" path
                const tsconfigBuildPath = path.join(fullLocation, "tsconfig.build.json");
                const tsconfigBuild = require(tsconfigBuildPath);
                tsconfigBuild.extends = baseTsConfigBuildPath;
                fs.writeFileSync(tsconfigBuildPath, JSON.stringify(tsconfigBuild, null, 2));

                replaceInPath(path.join(fullLocation, "src/index.tsx"), {
                    find: "PACKAGE_NAME",
                    replaceWith: Case.kebab(packageName)
                });

                // Update root package.json - update "workspaces.packages" section.
                const rootPackageJsonPath = path.join(projectRootPath, "package.json");
                const rootPackageJson = await readJson(rootPackageJsonPath);
                if (!rootPackageJson.workspaces.packages.includes(location)) {
                    rootPackageJson.workspaces.packages.push(location);
                    await writeJson(rootPackageJsonPath, rootPackageJson);
                }

                // Once everything is done, run `yarn` so the new packages are automatically installed.
                try {
                    await execa("yarn");
                } catch (err) {
                    throw new Error(
                        `Unable to install dependencies. Try running "yarn" in project root manually.`
                    );
                }
            }
        }
    }
];
