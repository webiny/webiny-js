import { createImplementation } from "@webiny/di";
import {
    CliCommandFactory,
    GetProjectSdkService,
    UiService
} from "@webiny/cli-core/abstractions/index.js";
import { ResetPassword } from "./ResetPassword.js";
import { readResetPasswordTarget } from "./readResetPasswordTarget.js";
import { SIGNING_SECRET_ENV_VAR } from "~/shared/envVars.js";

/**
 * `webiny reset-password <email>`, the lockout escape hatch for self-hosted projects.
 *
 * The command owns the conversation with the operator and nothing else: it declares the arguments,
 * prompts for the password, and reports the outcome. `ResetPassword` does the work, so the same
 * reset is available to anything that is not a terminal.
 *
 * Which instance it talks to: `WEBINY_API_URL` and `WEBINY_SELF_HOSTED_AUTH_SECRET` from the
 * environment of the machine running the command, which hold the webiny.config defaults unless the
 * operator set them. Setting them, or passing `--api-url` / `--signing-secret`, is what makes it
 * possible to reset on a deployed instance from a laptop configured for localhost, with the
 * production secret coming out of a secret manager rather than the repo.
 */

export interface IResetPasswordCommandParams {
    email: string;
    apiUrl?: string;
    signingSecret?: string;
}

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
                        "API origin to call, e.g. https://api.example.com. Defaults to " +
                        "$WEBINY_API_URL, which webiny.config's <Infra.ApiUrl> sets when it isn't " +
                        "set already. Pass it to reset a password on a deployed instance from a " +
                        "machine configured for localhost.",
                    type: "string"
                },
                {
                    name: "signing-secret",
                    description:
                        "JWT signing secret to sign the reset token with. Defaults to " +
                        `$${SIGNING_SECRET_ENV_VAR}, which webiny.config's <SelfHostedAuth ` +
                        "signingSecret> sets when it isn't set already. Prefer the env var over " +
                        "this flag: a flag is visible in shell history and the process list.",
                    type: "string"
                }
            ],
            handler: async params => {
                // Loading the project copies webiny.config's env vars into process.env, without
                // overwriting any the operator set. That is where the defaults below come from.
                await this.getProjectSdkService.execute();

                // No `cliPasswordReset` check here. `<SelfHostedAuth>` does not render the
                // `Cli/Command` extension when the flag is off, so a disabled project has no such
                // command to invoke and any guard at this point is unreachable. The API's own
                // build decides whether the mutation exists, which is the enforcement that counts.

                // Before the prompt, so a missing secret or API URL fails without costing anyone a
                // typed-out password.
                const target = readResetPasswordTarget(
                    { apiUrl: params.apiUrl, signingSecret: params.signingSecret },
                    process.env
                );

                const password = await this.promptForPassword(params.email);

                ui.info("Setting password for %s...", params.email);

                const resetPassword = new ResetPassword();
                await resetPassword.execute({ email: params.email, password, target });

                ui.success("Password updated for %s.", params.email);
            }
        };
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
}

export default createImplementation({
    abstraction: CliCommandFactory,
    implementation: ResetPasswordCommand,
    dependencies: [GetProjectSdkService, UiService]
});
