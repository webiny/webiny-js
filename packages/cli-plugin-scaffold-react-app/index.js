const fs = require("fs");
const path = require("path");
const util = require("util");
const ncp = util.promisify(require("ncp").ncp);
const findUp = require("find-up");
const camelCase = require("lodash.camelcase");
const kebabCase = require("lodash.kebabcase");

const appTypes = {
    custom: "Custom App",
    admin: "Admin App",
    site: "Site App"
};
const appTypesArray = Object.values(appTypes);

module.exports = [
    {
        name: "cli-plugin-scaffold-template-react-app",
        type: "cli-plugin-scaffold-template",
        scaffold: {
            name: "React Application",
            questions: () => {
                return [
                    // TODO [Andrei] [At the end] uncomment the good code below
                    // {
                    //     name: "location",
                    //     message: "Enter package location (including package name)",
                    //     validate: location => {
                    //         if (location === "") {
                    //             return "Please enter a package location";
                    //         }
                    //
                    //         if (fs.existsSync(path.resolve(location))) {
                    //             return "The target location already exists";
                    //         }
                    //
                    //         const rootResourcesPath = findUp.sync("resources.js", {
                    //             cwd: path.resolve(location)
                    //         });
                    //         if (!rootResourcesPath) {
                    //             return `Resources file was not found. Make sure your package is inside of your project's root and that either it or one of its parent directories contains resources.js`;
                    //         }
                    //
                    //         return true;
                    //     }
                    // },
                    {
                        name: "type",
                        message: "Select application template type:",
                        type: "list",
                        choices: appTypesArray
                    }
                ];
            },
            generate: async ({ input }) => {
                const location = `./apps/boss-${new Date().getTime()}`; //input;
                const { type: appType } = input;
                const fullLocation = path.resolve(location);
                const rootResourcesPath = findUp.sync("resources.js", {
                    cwd: fullLocation
                });

                const relativeLocation = path
                    .relative(path.dirname(rootResourcesPath), fullLocation)
                    .replace(/\\/g, "/");

                const packageName = kebabCase(location);
                const resourceName = camelCase(packageName);

                // Get base TS config path
                const baseTsConfigPath = path
                    .relative(
                        fullLocation,
                        findUp.sync("tsconfig.json", {
                            cwd: fullLocation
                        })
                    )
                    .replace(/\\/g, "/");

                if (appType === appTypes.custom) {
                    // Then we also copy the template folder
                    const sourceFolder = path.join(__dirname, "template-custom-app");

                    if (fs.existsSync(location)) {
                        throw new Error(`Package ${packageName} already exists!`);
                    }

                    await fs.mkdirSync(location, { recursive: true });
                    await ncp(sourceFolder, location);

                    // Update the package's name
                    const packageJsonPath = path.resolve(location, "package.json");
                    let packageJson = fs.readFileSync(packageJsonPath, "utf8");
                    packageJson = packageJson.replace("[PACKAGE_NAME]", packageName);
                    fs.writeFileSync(packageJsonPath, packageJson);
                    // Update tsconfig "extends" path

                    const tsConfigPath = path.join(fullLocation, "tsconfig.json");
                    const tsconfig = require(tsConfigPath);
                    tsconfig.extends = baseTsConfigPath;
                    fs.writeFileSync(tsConfigPath, JSON.stringify(tsconfig, null, 2));
                } else if (appType === appTypes.admin) {
                    // TODO [Andrei] [Question] Is this good usage of the "app-template-admin" package?
                    /*
                        import React from "react";
                        import adminAppTemplate from "@webiny/app-template-admin";
                        import "./App.scss";

                        export default adminAppTemplate({
                        cognito: {
                            region: process.env.REACT_APP_USER_POOL_REGION,
                            userPoolId: process.env.REACT_APP_USER_POOL_ID,
                            userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID
                        }
                        });

                     */
                } else {
                    // if (appType === appTypes.site) {
                    // TODO [Andrei] Make site template work
                }

                // Inject resource into closest resources.js //
                const { transform } = require("@babel/core");
                const source = fs.readFileSync(rootResourcesPath, "utf8");
                let resourceTpl = fs.readFileSync(path.join(__dirname, "resource.tpl"), "utf8");
                resourceTpl = resourceTpl.replace(/\[PACKAGE_PATH]/g, relativeLocation);

                const { code } = await transform(source, {
                    plugins: [[__dirname + "/transform", { template: resourceTpl, resourceName }]]
                });

                // Format code with prettier
                const prettier = require("prettier");
                const prettierConfig = await prettier.resolveConfig(rootResourcesPath);
                const formattedCode = prettier.format(code, { ...prettierConfig, parser: "babel" });

                fs.writeFileSync(rootResourcesPath, formattedCode);
            }
        }
    }
];
