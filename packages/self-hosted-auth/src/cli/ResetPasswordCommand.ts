import { createImplementation } from "@webiny/di";
import {
    CliCommandFactory,
    GetProjectSdkService,
    UiService
} from "@webiny/cli-core/abstractions/index.js";
import { signCliResetToken } from "~/shared/cliResetToken.js";
import { isCliPasswordResetEnabled } from "~/shared/buildParams.js";

/**
 * `webiny reset-password <email>`, the lockout escape hatch for self-hosted projects.
 *
 * Mints a short-lived token with the project's JWT signing secret (read straight out of
 * `webiny.config.tsx`) and hands it to the `selfHostedAuthCliResetPassword` mutation. Going
 * through the API rather than the database means this works whatever storage the project
 * registered (SQL, Mongo, anything implementing `CredentialsStorageOperations`), and keeps
 * the CLI free of database drivers.
 *
 * The trade is that the API has to be reachable. That is the right trade: this exists for
 * "locked out of the admin UI", and if the API is down a password is not what is blocking you.
 */

/** Extension type ids, referenced as strings so the CLI need not import the React config modules. */
const SELF_HOSTED_AUTH_EXTENSION = "Project/SelfHostedAuth";
const API_URL_EXTENSION = "Infra/ApiUrl";

interface SelfHostedAuthParams {
    signingSecret: string;
    cliPasswordReset?: boolean;
}

interface ApiUrlParams {
    url: string;
}

/**
 * The slice of the project config this command uses. Typed structurally rather than imported,
 * for the same reason the extension types above are strings.
 */
interface ProjectConfigLike {
    extensionsByType(type: string): Array<{ params: unknown }>;
}

export interface IResetPasswordCommandParams {
    email: string;
    apiUrl?: string;
}

const MUTATION = /* GraphQL */ `
    mutation SelfHostedAuthCliResetPassword($token: String!, $password: String!) {
        selfHostedAuthCliResetPassword(token: $token, password: $password) {
            data
            error {
                code
                message
            }
        }
    }
`;

// Matches the policy in SetPasswordUseCase. Checked here too, so a typo costs a prompt rather
// than a round trip.
const MIN_PASSWORD_LENGTH = 8;

export class ResetPasswordCommand implements CliCommandFactory.Interface<IResetPasswordCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private uiService: UiService.Interface
    ) {}

    async execute(): Promise<CliCommandFactory.CommandDefinition<IResetPasswordCommandParams>> {
        const ui = this.uiService;

        return {
            name: "reset-password",
            description:
                "Set a self-hosted user's password directly, without going through the admin UI.",
            examples: [
                "$0 reset-password admin@example.com",
                "$0 reset-password admin@example.com --api-url=http://localhost:3002"
            ],
            params: [
                {
                    name: "email",
                    description: "Email address of the user whose password to set.",
                    type: "string",
                    required: true
                }
            ],
            options: [
                {
                    name: "api-url",
                    description:
                        "API origin to call. Defaults to the <Infra.ApiUrl> value from webiny.config.",
                    type: "string"
                }
            ],
            handler: async params => {
                const projectSdk = await this.getProjectSdkService.execute();

                // Queried without tags: `Project/SelfHostedAuth` and `Infra/ApiUrl` are
                // project-level, so an app- or cli-scoped query would filter them out.
                const projectConfig = await projectSdk.getProjectConfig();

                const [authExtension] = projectConfig.extensionsByType(SELF_HOSTED_AUTH_EXTENSION);
                if (!authExtension) {
                    throw new Error(
                        "Self-hosted auth is not configured. Add <SelfHostedAuth signingSecret={...} /> to webiny.config."
                    );
                }

                const authParams = authExtension.params as unknown as SelfHostedAuthParams;

                if (!isCliPasswordResetEnabled(authParams.cliPasswordReset)) {
                    throw new Error(
                        "CLI password reset is disabled for this project. Remove " +
                            "`cliPasswordReset={false}` from <SelfHostedAuth /> to re-enable it."
                    );
                }

                if (!authParams.signingSecret) {
                    throw new Error(
                        "No JWT signing secret is configured. Check the `signingSecret` prop on " +
                            "<SelfHostedAuth /> and the environment variable behind it."
                    );
                }

                const apiUrl = this.resolveApiUrl(params.apiUrl, projectConfig);

                const password = await this.promptForPassword(params.email);

                ui.info("Setting password for %s...", params.email);

                const token = signCliResetToken({
                    secret: authParams.signingSecret,
                    email: params.email
                });

                await this.callApi({ apiUrl, token, password });

                ui.success("Password updated for %s.", params.email);
            }
        };
    }

    private resolveApiUrl(override: string | undefined, projectConfig: ProjectConfigLike): string {
        if (override) {
            return override.replace(/\/+$/, "");
        }

        const [apiUrlExtension] = projectConfig.extensionsByType(API_URL_EXTENSION);
        if (!apiUrlExtension) {
            throw new Error(
                "No API URL configured. Add <Infra.ApiUrl url={...} /> to webiny.config, or pass --api-url."
            );
        }

        const { url } = apiUrlExtension.params as ApiUrlParams;

        return url.replace(/\/+$/, "");
    }

    private async promptForPassword(email: string): Promise<string> {
        // Imported here rather than at the top of the file: config validation imports this module
        // on every CLI invocation to check it exports a command, and only this one command ever
        // needs a prompt.
        const { default: inquirer } = await import("inquirer");

        // Prompted, never accepted as a flag: a password passed on the command line lands in
        // shell history and in the process list.
        const prompt = inquirer.createPromptModule();

        const { password } = await prompt<{ password: string }>({
            type: "password",
            name: "password",
            mask: "*",
            message: `New password for ${email}:`,
            validate: (value: string) => {
                if (!value || value.length < MIN_PASSWORD_LENGTH) {
                    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
                }
                return true;
            }
        });

        const { confirmation } = await prompt<{ confirmation: string }>({
            type: "password",
            name: "confirmation",
            mask: "*",
            message: "Confirm password:"
        });

        if (password !== confirmation) {
            throw new Error("The two passwords do not match. Nothing was changed.");
        }

        return password;
    }

    private async callApi(params: { apiUrl: string; token: string; password: string }) {
        const endpoint = `${params.apiUrl}/graphql`;

        let response: Awaited<ReturnType<typeof fetch>>;
        try {
            response = await fetch(endpoint, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    query: MUTATION,
                    variables: { token: params.token, password: params.password }
                })
            });
        } catch (err) {
            throw new Error(
                `Could not reach the API at ${endpoint}: ${(err as Error).message}. ` +
                    "Make sure it is running, or point at it with --api-url."
            );
        }

        if (!response.ok) {
            throw new Error(`The API at ${endpoint} responded with ${response.status}.`);
        }

        const body = (await response.json()) as {
            data?: {
                selfHostedAuthCliResetPassword?: {
                    data: boolean | null;
                    error: { code: string; message: string } | null;
                };
            };
            errors?: Array<{ message: string }>;
        };

        if (body.errors?.length) {
            throw new Error(body.errors.map(error => error.message).join("; "));
        }

        const result = body.data?.selfHostedAuthCliResetPassword;
        if (!result) {
            // The mutation is absent from the schema when the flag is off. The config check above
            // catches the normal case; this catches a deployed API built before the flag was
            // flipped back on.
            throw new Error(
                "The API did not accept the reset. The `selfHostedAuthCliResetPassword` mutation " +
                    "is missing, which means the deployed API was built with CLI password reset " +
                    "disabled. Rebuild and redeploy the API, then try again."
            );
        }

        if (result.error) {
            throw new Error(`${result.error.message} (${result.error.code})`);
        }
    }
}

export default createImplementation({
    abstraction: CliCommandFactory,
    implementation: ResetPasswordCommand,
    dependencies: [GetProjectSdkService, UiService]
});
