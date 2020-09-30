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
const { green } = require("chalk");

module.exports = [
    {
        name: "cli-plugin-scaffold-template-node-package",
        type: "cli-plugin-scaffold-template",
        scaffold: {
            name: "Node Package",
            questions: ({ context }) => {
                return [
                    {
                        name: "location",
                        message: "Enter package location",
                        default: "packages/my-utils",
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
            generate: async ({ input, wait, oraSpinner }) => {
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

                oraSpinner.start(`Creating Node package files in ${green(fullLocation)}...`);
                await wait();

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

                const baseJestConfigPath = path
                    .relative(
                        fullLocation,
                        findUp.sync("jest.config.base.js", {
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

                // Get .babel.node.js path
                const babelNodeJsPath = path
                    .relative(
                        fullLocation,
                        findUp.sync(".babel.node.js", {
                            cwd: fullLocation
                        })
                    )
                    .replace(/\\/g, "/");

                // Update .babelrc.js
                const babelrcPath = path.resolve(location, ".babelrc.js");
                let babelrc = fs.readFileSync(babelrcPath, "utf8");
                babelrc = babelrc.replace("[.BABEL.NODE_PATH]", babelNodeJsPath);
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

                // Update "jest.config.base" require path
                const jestConfigPath = path.join(fullLocation, "jest.config.js");
                let jestConfig = fs.readFileSync(jestConfigPath).toString();
                jestConfig = jestConfig.replace("[JEST_CONFIG_BASE_PATH]", baseJestConfigPath);
                fs.writeFileSync(jestConfigPath, jestConfig);

                replaceInPath(path.join(fullLocation, "src/index.ts"), [
                    { find: "PACKAGE_NAME_CAMEL_CASED", replaceWith: Case.camel(packageName) },
                    { find: "PACKAGE_NAME", replaceWith: Case.kebab(packageName) }
                ]);

                oraSpinner.stopAndPersist({
                    symbol: green("✔"),
                    text: `Node package files created in ${green(fullLocation)}.`
                });

                // Update root package.json - update "workspaces.packages" section.
                oraSpinner.start(
                    `Adding ${green(input.location)} workspace in root ${green(`package.json`)}..`
                );
                await wait();

                const rootPackageJsonPath = path.join(projectRootPath, "package.json");
                const rootPackageJson = await readJson(rootPackageJsonPath);
                if (!rootPackageJson.workspaces.packages.includes(location)) {
                    rootPackageJson.workspaces.packages.push(location);
                    await writeJson(rootPackageJsonPath, rootPackageJson);
                }

                oraSpinner.stopAndPersist({
                    symbol: green("✔"),
                    text: `Workspace ${green(input.location)} added in root ${green(
                        `package.json`
                    )}.`
                });

                try {
                    oraSpinner.start(`Installing dependencies...`);
                    await execa("yarn");
                    oraSpinner.stopAndPersist({
                        symbol: green("✔"),
                        text: "Dependencies installed."
                    });
                } catch (err) {
                    throw new Error(
                        `Unable to install dependencies. Try running "yarn" in project root manually.`
                    );
                }

                try {
                    oraSpinner.start(`Building package...`);
                    await execa("yarn", ["build"], { cwd: fullLocation });
                    oraSpinner.stopAndPersist({
                        symbol: green("✔"),
                        text: "Package built."
                    });
                } catch (err) {
                    throw new Error(
                        `Unable to build package. Try running "yarn build" in ${green(
                            fullLocation
                        )}.`
                    );
                }
            }
        }
    }
];
