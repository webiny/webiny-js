const fs = require("fs");
const path = require("path");
const util = require("util");
const ncp = util.promisify(require("ncp").ncp);
const findUp = require("find-up");
const camelCase = require("lodash.camelcase");

module.exports = [
    {
        name: "scaffold-template-custom-lambda",
        type: "scaffold-template",
        scaffold: {
            name: "Custom Lambda Function",
            questions: () => {
                return [
                    {
                        name: "location",
                        message: "Enter package location (including package name)",
                        validate: location => {
                            if (location === "") {
                                return "Please enter a package location";
                            }

                            if (fs.existsSync(path.resolve(location)))
                                return "The target location already exists";

                            return true;
                        }
                    }
                ];
            },
            generate: async ({ input }) => {
                const { location } = input;
                const rootResourcesPath = findUp.sync("resources.js", {
                    cwd: path.resolve(location)
                });

                const packageName = path.basename(location);
                const resourceName = camelCase(packageName);

                // Then we also copy the template folder
                const sourceFolder = path.join(__dirname, "template");

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

                // Inject resource into closest resources.js
                const { transform } = require("@babel/core");
                const source = fs.readFileSync(rootResourcesPath, "utf8");
                let resourceTpl = fs.readFileSync(path.join(__dirname, "resource.tpl"), "utf8");
                resourceTpl = resourceTpl.replace(/\[PACKAGE_NAME\]/g, packageName);

                const { code } = await transform(source, {
                    plugins: [[__dirname + "/transform", { template: resourceTpl, resourceName }]]
                });

                // Format code with prettier
                const prettier = require("prettier");
                const prettierConfig = await prettier.resolveConfig(rootResourcesPath);
                const formattedCode = prettier.format(code, prettierConfig);

                fs.writeFileSync(rootResourcesPath, formattedCode);
            }
        }
    }
];

// const yaml = require("js-yaml");
// const fs = require("fs");
// const path = require("path");
// const util = require("util");
// const ncp = util.promisify(require("ncp").ncp);
// const execa = require("execa");
// const _ = require("lodash");
//
// const getPackageLocation = ({ context, packageFolderName }) =>
//     path.join(context.packagesPath, packageFolderName);
// const getPackageFolderName = packageName => packageName.split("/").pop();
// const getServiceName = packageName => _.camelCase(packageName.split("/").pop());
//
// module.exports = [
//     /*{
//         name: "scaffold-template-custom-lambda",
//         type: "scaffold-template",
//         scaffold: {
//             name: "Custom Lambda Function",
//             questions: ({ context }) => {
//                 if (!fs.existsSync(context.apiYaml)) {
//                     console.log(
//                         "File ./api/serverless.yml can not be loaded! Make sure you are running the scaffold utilty from your Project's root."
//                     );
//                     process.exit();
//                 }
//
//                 return [
//                     {
//                         name: "packageName",
//                         message: "Package Name",
//                         validate: packageName => {
//                             const packageFolderName = getPackageFolderName(packageName);
//                             if (packageName === "")
//                                 return "Please enter a valid name for your package.";
//                             if (fs.existsSync(getPackageLocation({ context, packageFolderName })))
//                                 return "This package already exists! Please pick a different name";
//
//                             return true;
//                         }
//                     },
//                     {
//                         name: "lambdaUrlPath",
//                         message: "Lambda URL Path",
//                         validate: lambdaPath => {
//                             if (lambdaPath.match(/[^0-9a-zA-Z-_]/))
//                                 return "Please insert a valid URL path. (alphanumeric, hyphens and underscores only)";
//
//                             return true;
//                         }
//                     }
//                 ];
//             },
//             generate: async ({ input, context, oraSpinner }) => {
//                 const warnings = [];
//                 try {
//                     const { packageName, lambdaUrlPath } = input;
//                     const serviceName = getServiceName(packageName);
//                     const packageFolderName = getPackageFolderName(packageName);
//                     const packageLocation = getPackageLocation({ context, packageFolderName });
//
//                     const serverlessJson = yaml.safeLoad(fs.readFileSync(context.apiYaml));
//                     if (serverlessJson[serviceName])
//                         throw new Error(`Service ${serviceName} already exists serverless.yml!`);
//
//                     const pushNewEndpoint = ({ serverlessJson, newEndpoint }) => {
//                         if (
//                             serverlessJson.api.inputs.endpoints.find(
//                                 endpoint => endpoint.path === lambdaUrlPath
//                             )
//                         )
//                             throw new Error(
//                                 `Path ${lambdaUrlPath} already exists among the endpoints! Please pick a different path or modify the exiting ones.`
//                             );
//                         serverlessJson.api.inputs.endpoints.push(newEndpoint);
//                     };
//                     const fixServerlessVariables = (serverlessJson, serverlessVariables) => {
//                         if (serverlessVariables.length === 0) return;
//
//                         if (serverlessJson.vars === undefined) {
//                             serverlessJson.vars = {};
//                         }
//                         for (const variable of serverlessVariables)
//                             if (serverlessJson.vars[variable.name] === undefined) {
//                                 warnings.push(
//                                     `[Info] Variable "${variable.name}" does not exist in serverless.yml. The default value of "${variable.default}" was provided.`
//                                 );
//                                 serverlessJson.vars[variable.name] = variable.default;
//                             }
//                     };
//
//                     pushNewEndpoint({
//                         serverlessJson,
//                         newEndpoint: {
//                             path: `/${lambdaUrlPath}`,
//                             method: "ANY",
//                             function: `\${${serviceName}}`
//                         }
//                     });
//                     fixServerlessVariables(serverlessJson, [
//                         {
//                             name: "region",
//                             default: "us-east-1"
//                         }
//                     ]);
//
//                     serverlessJson[serviceName] = {
//                         component: "@webiny/serverless-function",
//                         inputs: {
//                             description: "Lambda Function generated by the CLI",
//                             region: "${vars.region}",
//                             hook: `yarn build`,
//                             root: `./../packages/${packageFolderName}`,
//                             code: `./../packages/${packageFolderName}/dist`,
//                             handler: "handler.handler",
//                             memory: 2048,
//                             timeout: 60
//                         }
//                     };
//
//                     fs.writeFileSync(context.apiYaml, yaml.safeDump(serverlessJson));
//
//                     // Then we also copy the template folder
//                     const sourceFolder = path.join(__dirname, "templatePackage");
//                     const destFolder = packageLocation;
//
//                     if (fs.existsSync(packageLocation))
//                         throw new Error(`Package ${packageName} already exists!`);
//                     await fs.mkdirSync(destFolder, { recursive: true });
//                     await ncp(sourceFolder, destFolder);
//
//                     // Update the package's name
//                     const servicePackageJsonPath = path.join(packageLocation, "package.json");
//                     let servicePackageJson = fs.readFileSync(servicePackageJsonPath).toString();
//                     servicePackageJson = servicePackageJson.replace("PACKAGE_NAME", packageName);
//                     fs.writeFileSync(servicePackageJsonPath, servicePackageJson);
//
//                     oraSpinner.text = "Linking packages...";
//                     await execa("yarn");
//                     oraSpinner.text = "Building the newly generated package...";
//                     await execa("yarn", ["build"], { cwd: packageLocation });
//                     oraSpinner.succeed("Successfully scaffolded the Custom Lambda Function!");
//                 } catch (e) {
//                     oraSpinner.stop();
//                     console.log(e);
//                 } finally {
//                     if (warnings.length > 0) console.log(warnings.join("\n"));
//                 }
//             }
//         }
//     }*/
// ];
