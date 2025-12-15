import { ApiAfterDeploy } from "webiny/infra/features/ApiAfterDeploy";
import { UiService } from "webiny/infra/features/UiService";
import { GetAppStackOutput } from "webiny/infra/features/GetAppStackOutput";
import { LambdaClient, InvokeCommand } from "@webiny/aws-sdk/client-lambda/index.js";

const IS_INSTALLED_QUERY = `
    query IsSystemInstalled {
        system {
            isSystemInstalled {
                data
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

const INSTALL_MUTATION = `
    mutation InstallSystem($installationInput: JSON!) {
        system {
            installSystem(installationInput: $installationInput) {
                data
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

class AutoInstallSystemAfterFirstDeploy implements ApiAfterDeploy.Interface {
    constructor(
        private getAppStackOutput: GetAppStackOutput.Interface,
        private ui: UiService.Interface
    ) {}

    async execute(params: ApiAfterDeploy.Params) {
        const autoInstallEnabled = process.env.WEBINY_AUTO_INSTALL === "true";
        if (!autoInstallEnabled) {
            return;
        }

        const stackOutput = await this.getAppStackOutput.execute(params);
        if (!stackOutput) {
            this.ui.error("Could not retrieve API stack output.");
            return;
        }

        const { graphqlLambdaName, region } = stackOutput as any;

        const lambdaClient = new LambdaClient({ region });

        // Check if system is already installed
        this.ui.info("Checking if system is already installed...");

        try {
            const isInstalledResponse = await lambdaClient.send(
                new InvokeCommand({
                    FunctionName: graphqlLambdaName,
                    InvocationType: "RequestResponse",
                    Payload: JSON.stringify({
                        path: "/graphql",
                        httpMethod: "POST",
                        headers: {
                            "x-tenant": "root",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            query: IS_INSTALLED_QUERY
                        })
                    })
                })
            );

            const decoder = new TextDecoder("utf-8");
            const lambdaResponse = JSON.parse(decoder.decode(isInstalledResponse.Payload));
            const result = JSON.parse(lambdaResponse.body);

            if (result.data?.system?.isSystemInstalled?.data === true) {
                this.ui.info("System is already installed, skipping auto-install.");
                return;
            }
        } catch (error: any) {
            this.ui.warning(`Could not check installation status: ${error.message}`);
        }

        this.ui.info("Auto-installing...");

        const variables = {
            installationInput: ([
                {
                    app: "AdminUser",
                    data: {
                        firstName: "John",
                        lastName: "Smith",
                        email: "admin@webiny.com",
                        password: "12345678"
                    }
                }
            ])
        };

        const installResponse = await lambdaClient.send(
            new InvokeCommand({
                FunctionName: graphqlLambdaName,
                InvocationType: "RequestResponse",
                Payload: JSON.stringify({
                    path: "/graphql",
                    httpMethod: "POST",
                    headers: {
                        "x-tenant": "root",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        query: INSTALL_MUTATION,
                        variables
                    })
                })
            })
        );

        const decoder = new TextDecoder("utf-8");
        const lambdaResponse = JSON.parse(decoder.decode(installResponse.Payload));
        const result = JSON.parse(lambdaResponse.body);

        if (result.data?.system?.installSystem?.error) {
            const { message, code } = result.data.system.installSystem.error;
            this.ui.error(`Installation failed: ${message} (${code})`);
            throw new Error(message);
        }

        this.ui.success("System installed successfully!");
        this.ui.info("Admin credentials:");
        this.ui.info("  Email: admin@webiny.com");
        this.ui.info("  Password: 12345678");
    }
}

export const AutoInstallSystem = ApiAfterDeploy.createImplementation({
    implementation: AutoInstallSystemAfterFirstDeploy,
    dependencies: [GetAppStackOutput, UiService]
});
