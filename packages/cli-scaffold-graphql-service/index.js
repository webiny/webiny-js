const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");
const util = require("util");
const ncp = util.promisify(require("ncp").ncp);
const execa = require("execa");
const _ = require("lodash");

const getPackageLocation = ({ context, packageFolderName }) =>
    path.join(context.packagesPath, packageFolderName);
const getPackageFolderName = packageName => packageName.split("/").pop();

module.exports = [
    {
        name: "scaffold-template-apollo-service",
        type: "scaffold-template",
        scaffold: {
            name: "GraphQL Apollo Service",
            questions: ({ context }) => {
                if (!fs.existsSync(context.apiYaml)) {
                    console.log(
                        "File ./api/serverless.yml can not be loaded! Make sure you are running the scaffold utilty from your Project's root."
                    );
                    process.exit();
                }

                return [
                    {
                        name: "packageName",
                        message: "Package Name",
                        validate: packageName => {
                            const packageFolderName = getPackageFolderName(packageName);
                            if (packageName === "")
                                return "Please enter a valid name for your package.";
                            if (fs.existsSync(getPackageLocation({ context, packageFolderName })))
                                return "This package already exists! Please pick a different name";

                            return true;
                        }
                    }
                ];
            },
            generate: async ({ input, context, oraSpinner }) => {
                const warnings = [];
                try {
                    // First we update serverless.yml
                    const { packageName } = input;
                    const serviceName = _.camelCase(packageName.split("/").pop()); // There can be only one slash, ie: @webiny/my-package. We extract the package's name and convert it to camelCase
                    const packageFolderName = getPackageFolderName(packageName);
                    const packageLocation = getPackageLocation({ context, packageFolderName });

                    const serverlessJson = yaml.safeLoad(fs.readFileSync(context.apiYaml));
                    if (serverlessJson[serviceName])
                        throw new Error(
                            `Service ${serviceName} already exists serverless.yml! This error should've been thrown earlier...`
                        );

                    const fixServerlessVariables = (serverlessJson, serverlessVariables) => {
                        if (serverlessVariables.length === 0) return;

                        if (serverlessJson.vars === undefined) {
                            serverlessJson.vars = {};
                        }
                        for (const variable of serverlessVariables)
                            if (serverlessJson.vars[variable.name] === undefined) {
                                warnings.push(
                                    `[Info] Variable "${variable.name}" does not exist in serverless.yml. The default value of "${variable.default}" was provided.`
                                );
                                serverlessJson.vars[variable.name] = variable.default;
                            }
                    };
                    fixServerlessVariables(serverlessJson, [
                        {
                            name: "region",
                            default: "us-east-1"
                        },
                        {
                            name: "debug",
                            default: false
                        },
                        {
                            name: "security",
                            default: {
                                token: {
                                    expiresIn: 2592000,
                                    secret: "${env.JWT_SECRET}"
                                }
                            }
                        }
                    ]);

                    serverlessJson[serviceName] = {
                        component: "@webiny/serverless-apollo-service",
                        inputs: {
                            description: `Apollo service '${serviceName}' scaffoled by the CLI.`,
                            region: "${vars.region}",
                            memory: 512,
                            debug: "${vars.debug}",
                            hook: "yarn build",
                            root: `../${packageLocation}`,
                            code: `../${packageLocation}/dist`,
                            webpackConfig: "./webpack.config.js",
                            plugins: [
                                {
                                    factory: "@webiny/api-security/plugins",
                                    options: "${vars.security}"
                                }
                            ]
                        }
                    };

                    fs.writeFileSync(context.apiYaml, yaml.safeDump(serverlessJson));

                    // Then we also copy the template folder
                    const sourceFolder = path.join(__dirname, "templateService");
                    const destFolder = packageLocation;

                    if (fs.existsSync(packageLocation))
                        throw new Error(`Package ${packageName} already exists!`);
                    await fs.mkdirSync(destFolder, { recursive: true });
                    await ncp(sourceFolder, destFolder);

                    // Update the package's name
                    const servicePackageJsonPath = path.join(packageLocation, "package.json");
                    let servicePackageJson = fs.readFileSync(servicePackageJsonPath).toString();
                    servicePackageJson = servicePackageJson.replace("PACKAGE_NAME", packageName);
                    fs.writeFileSync(servicePackageJsonPath, servicePackageJson);

                    oraSpinner.text = "Linking packages...";
                    await execa("yarn");
                    // oraSpinner.text = "Building the newly generated package...";
                    // await execa("yarn", ["build"], { cwd: packageLocation });
                    oraSpinner.succeed("Successfully scaffolded the template!");
                } catch (e) {
                    oraSpinner.stop();
                    console.log(e);
                } finally {
                    if (warnings.length > 0) console.log(warnings.join("\n"));
                }
            }
        }
    }
];
