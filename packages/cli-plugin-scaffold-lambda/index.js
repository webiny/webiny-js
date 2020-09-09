const fs = require("fs");
const path = require("path");
const util = require("util");
const ncp = util.promisify(require("ncp").ncp);
const findUp = require("find-up");
const camelCase = require("lodash.camelcase");
const kebabCase = require("lodash.kebabcase");
const { green } = require("chalk");
const indentString = require("indent-string");
const { replaceInPath } = require("replace-in-path");

module.exports = [
    {
        name: "cli-plugin-scaffold-template-lambda",
        type: "cli-plugin-scaffold-template",
        scaffold: {
            name: "Lambda Function",
            questions: () => {
                return [
                    {
                        name: "location",
                        message: "Enter package location (including package name)",
                        default: "api/new-function",
                        validate: location => {
                            if (location === "") {
                                return "Please enter a package location";
                            }

                            if (fs.existsSync(path.resolve(location))) {
                                return "The target location already exists";
                            }

                            const rootResourcesPath = findUp.sync("resources.js", {
                                cwd: path.resolve(location)
                            });
                            if (!rootResourcesPath) {
                                return `Resources file was not found. Make sure your package is inside of your project's root and that either it or one of its parent directories contains resources.js`;
                            }

                            return true;
                        }
                    }
                ];
            },
            generate: async ({ input, wait, oraSpinner }) => {
                const { location } = input;
                const fullLocation = path.resolve(location);
                const rootResourcesPath = findUp.sync("resources.js", {
                    cwd: fullLocation
                });

                const relativeLocation = path
                    .relative(path.dirname(rootResourcesPath), fullLocation)
                    .replace(/\\/g, "/");

                const packageName = kebabCase(location);
                const resourceName = camelCase(packageName);

                // Then we also copy the template folder
                const sourceFolder = path.join(__dirname, "template");

                if (fs.existsSync(location)) {
                    throw new Error(`Package ${packageName} already exists!`);
                }

                oraSpinner.start(`Creating Lambda function files in ${green(fullLocation)}...`);
                await wait();

                await fs.mkdirSync(location, { recursive: true });

                // Get base TS config path
                const baseTsConfigPath = path
                    .relative(
                        fullLocation,
                        findUp.sync("tsconfig.json", {
                            cwd: fullLocation
                        })
                    )
                    .replace(/\\/g, "/");

                // Copy template files
                await ncp(sourceFolder, location);

                const codeReplacements = [{ find: "FUNCTION_NAME", replaceWith: resourceName }];
                replaceInPath(path.join(fullLocation, "src/**/*.ts"), codeReplacements);

                // Update the package's name
                const packageJsonPath = path.resolve(location, "package.json");
                let packageJson = fs.readFileSync(packageJsonPath, "utf8");
                packageJson = packageJson.replace("[PACKAGE_NAME]", packageName);
                fs.writeFileSync(packageJsonPath, packageJson);

                oraSpinner.stopAndPersist({
                    symbol: green("✔"),
                    text: `Lambda function files created in ${green(fullLocation)}.`
                });

                // Inject resource into closest resources.js
                oraSpinner.start(
                    `Adding ${green(resourceName)} resource in ${green(rootResourcesPath)}...`
                );
                await wait();

                const { transform } = require("@babel/core");
                const source = fs.readFileSync(rootResourcesPath, "utf8");
                let resourceTpl = fs.readFileSync(path.join(__dirname, "resource.tpl"), "utf8");
                resourceTpl = resourceTpl.replace(/\[PACKAGE_PATH]/g, relativeLocation);

                const { code } = await transform(source, {
                    plugins: [[__dirname + "/transform", { template: resourceTpl, resourceName }]]
                });

                oraSpinner.stopAndPersist({
                    symbol: green("✔"),
                    text: `Resource ${green(resourceName)} added in ${green(rootResourcesPath)}.`
                });

                // Update tsconfig "extends" path
                const tsConfigPath = path.join(fullLocation, "tsconfig.json");
                const tsconfig = require(tsConfigPath);
                tsconfig.extends = baseTsConfigPath;
                fs.writeFileSync(tsConfigPath, JSON.stringify(tsconfig, null, 2));

                // Format code with prettier
                const prettier = require("prettier");
                const prettierConfig = await prettier.resolveConfig(rootResourcesPath);
                const formattedCode = prettier.format(code, { ...prettierConfig, parser: "babel" });

                fs.writeFileSync(rootResourcesPath, formattedCode);
            },
            onSuccess({ input }) {
                const { location } = input;
                const fullLocation = path.resolve(location);
                const indexTsLocation = path.join(fullLocation, "/src/index.ts");
                const projectRootPath = path.dirname(
                    findUp.sync("webiny.root.js", {
                        cwd: fullLocation
                    })
                );

                const rootResourcesPath = findUp.sync("resources.js", {
                    cwd: fullLocation
                });

                const rootResourcesDir = path.dirname(rootResourcesPath);

                const deployCommandStackPath = rootResourcesDir
                    .replace(projectRootPath, "")
                    .replace("/", "");

                console.log(`The next steps:`);
                console.log(indentString(`1. Put your code in ${green(indexTsLocation)}.`, 2));
                console.log(
                    indentString(
                        `2. Open ${green(
                            rootResourcesPath
                        )} and in your API Gateway resource, define a new endpoint over which your new Lambda function will be invoked.`,
                        2
                    )
                );
                console.log(
                    indentString(
                        `3. Finally, deploy the ${green(
                            deployCommandStackPath
                        )} stack by running ${green(
                            `webiny deploy ${deployCommandStackPath} --env local`
                        )}.`,
                        2
                    )
                );
                console.log(
                    `Learn more about API development at https://docs.webiny.com/docs/api-development/introduction`
                );
            }
        }
    }
];
