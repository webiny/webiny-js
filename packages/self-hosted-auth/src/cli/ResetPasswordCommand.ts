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
 *
 * Which instance it talks to: whatever the config resolves to on the machine running the command.
 * The self-hosted hosting type has no deploy environments, so there is a single `<Infra.ApiUrl>`
 * value and a single `signingSecret`, both resolved locally. `--api-url` and `--signing-secret`
 * (or the env var) override them, which is what makes it possible to reset on a deployed instance
 * from a laptop configured for localhost, with the production secret coming out of a secret
 * manager rather than the repo.
 *
 * The secret has to match whatever the target API was built with, or the token will not verify.
 * `explainError` names that as the likely cause, since it is the one thing most easily got wrong.
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
    signingSecret?: string;
}

/**
 * Env var read as the secret when neither `--signing-secret` nor the project config supplies one.
 * The safer of the two overrides: a secret passed as a flag is visible in shell history and in
 * the process list, whereas a secret manager can inject an env var into just this process
 * (`op run -- yarn webiny reset-password ...`).
 */
const SIGNING_SECRET_ENV_VAR = "WEBINY_SELF_HOSTED_SIGNING_SECRET";

const MUTATION_NAME = "selfHostedAuthCliResetPassword";

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
                "$0 reset-password admin@example.com --api-url=https://api.example.com",
                `${SIGNING_SECRET_ENV_VAR}=$(op read op://vault/webiny-prod/signing-secret) $0 reset-password admin@example.com --api-url=https://api.example.com`
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
                        "API origin to call, e.g. https://api.example.com. Defaults to the " +
                        "<Infra.ApiUrl> value from webiny.config. Pass it to reset a password on " +
                        "a deployed instance from a machine configured for localhost.",
                    type: "string"
                },
                {
                    name: "signing-secret",
                    description:
                        "JWT signing secret to sign the reset token with. Defaults to the " +
                        `\`signingSecret\` from webiny.config, then to $${SIGNING_SECRET_ENV_VAR}. ` +
                        "Prefer the env var: a flag is visible in shell history and the process list.",
                    type: "string"
                }
            ],
            handler: async params => {
                const projectSdk = await this.getProjectSdkService.execute();

                // Queried without tags: `Project/SelfHostedAuth` and `Infra/ApiUrl` are
                // project-level, so an app- or cli-scoped query would filter them out.
                const projectConfig = await projectSdk.getProjectConfig();

                const [authExtension] = projectConfig.extensionsByType(SELF_HOSTED_AUTH_EXTENSION);
                const authParams = authExtension?.params as SelfHostedAuthParams | undefined;

                // Only meaningful when the local config is the one describing the target instance.
                // Someone overriding both the secret and the URL is aiming at a different instance
                // entirely, whose own build decides whether the mutation exists.
                if (authParams && !isCliPasswordResetEnabled(authParams.cliPasswordReset)) {
                    throw new Error(
                        "CLI password reset is disabled for this project. Remove " +
                            "`cliPasswordReset={false}` from <SelfHostedAuth /> to re-enable it."
                    );
                }

                const signingSecret = this.resolveSigningSecret(params.signingSecret, authParams);
                const apiUrl = this.resolveApiUrl(params.apiUrl, projectConfig);

                const password = await this.promptForPassword(params.email);

                ui.info("Setting password for %s...", params.email);

                const token = signCliResetToken({
                    secret: signingSecret,
                    email: params.email
                });

                await this.callApi({ apiUrl, token, password });

                ui.success("Password updated for %s.", params.email);
            }
        };
    }

    /**
     * Flag, then project config, then env var. The flag wins because it is the most deliberate
     * thing the operator can do, and the env var comes last so a stale shell export cannot
     * silently override a project that is correctly configured.
     */
    private resolveSigningSecret(
        override: string | undefined,
        authParams: SelfHostedAuthParams | undefined
    ): string {
        const secret = override || authParams?.signingSecret || process.env[SIGNING_SECRET_ENV_VAR];

        if (!secret) {
            throw new Error(
                "No JWT signing secret available. Either configure <SelfHostedAuth " +
                    `signingSecret={...} /> in webiny.config, set $${SIGNING_SECRET_ENV_VAR}, or ` +
                    "pass --signing-secret. It has to match the secret the target API was built with."
            );
        }

        return secret;
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
            const messages = body.errors.map(error => error.message);

            // An API built with `cliPasswordReset={false}` has no such field, and GraphQL rejects
            // an unknown field during validation. So this arrives as a schema error rather than as
            // a null result, and the raw "Cannot query field" text would tell the operator nothing
            // about the cause.
            if (messages.some(message => message.includes(MUTATION_NAME))) {
                throw new Error(
                    `The API at ${endpoint} has no \`${MUTATION_NAME}\` mutation, which means it ` +
                        "was built with CLI password reset disabled. Remove " +
                        "`cliPasswordReset={false}` from <SelfHostedAuth />, then rebuild and " +
                        "redeploy the API."
                );
            }

            throw new Error(messages.join("; "));
        }

        const result = body.data?.selfHostedAuthCliResetPassword;
        if (!result) {
            throw new Error(`The API at ${endpoint} returned an unexpected response.`);
        }

        if (result.error) {
            throw new Error(this.explainError(result.error, endpoint));
        }
    }

    private explainError(error: { code: string; message: string }, endpoint: string): string {
        const base = `${error.message} (${error.code})`;

        // The token is signed with whatever secret resolved on THIS machine, and verified against
        // whatever the API was built with. Those differ more often than anything else that
        // produces this code, and the bare message gives no hint of it.
        if (error.code === "INVALID_RESET_TOKEN") {
            return (
                `${base} The usual cause is a signing secret mismatch: the secret this command ` +
                `signed with is not the one ${endpoint} was built with. Pass the right one with ` +
                `--signing-secret or $${SIGNING_SECRET_ENV_VAR}. A clock skew of over two minutes ` +
                "between this machine and the API will do it too."
            );
        }

        return base;
    }
}

export default createImplementation({
    abstraction: CliCommandFactory,
    implementation: ResetPasswordCommand,
    dependencies: [GetProjectSdkService, UiService]
});
