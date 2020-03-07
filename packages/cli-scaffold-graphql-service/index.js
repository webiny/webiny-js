const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");
const util = require("util");
const ncp = util.promisify(require("ncp").ncp);
const execa = require("execa");

const getServiceLocation = ({ context, serviceName }) => path.join(context.apiPath, serviceName);
// path.join(context.packagesPath, `api-${serviceName}`);

module.exports = [
    {
        name: "scaffold-template-apollo-service",
        type: "scaffold-template",
        scaffold: {
            name: "GraphQL Apollo Service",
            // description: "Creates an /api template and fills it in serverless.yml",
            questions: ({ context }) => {
                if (!fs.existsSync(context.apiYaml)) {
                    console.log(
                        "File ./api/serverless.yml can not be loaded! Make sure you are running the scaffold utilty from your Project's root."
                    );
                    process.exit();
                }

                return [
                    {
                        name: "serviceName",
                        message: "Service Name",
                        validate: serviceName => {
                            if (serviceName === "")
                                return "Please enter a valid name for your service.";
                            if (fs.existsSync(getServiceLocation({ context, serviceName })))
                                return "This service already exists! Please pick a different name";

                            return true;
                        }
                    }
                ];
            },
            generate: async ({ input, context }) => {
                const warnings = [];
                await new Promise(res => setTimeout(() => res(), 2000));
                try {
                    // First we update serverless.yml
                    const { serviceName } = input;
                    const serviceLocation = getServiceLocation({ context, serviceName });

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
                            root: serviceLocation,
                            code: `${serviceLocation}/build`,
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
                    const destFolder = path.join(serviceLocation);

                    if (fs.existsSync(serviceLocation))
                        throw new Error(
                            `Service ${serviceName} already exists! This error should've been thrown earlier...`
                        );
                    await fs.mkdirSync(destFolder);
                    await ncp(sourceFolder, destFolder);

                    // [WIP] Run "yarn build" in order to link the new package
                    // await execa("yarn", ["--cwd", context.apiPath]);
                } catch (e) {
                    console.log(e);
                } finally {
                    if (warnings.length > 0) console.log(warnings.join("\n"));
                }
            }
        }
    }
];
