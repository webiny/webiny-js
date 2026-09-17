import { SIGNING_SECRET_BUILD_PARAM } from "~/shared/buildParams.js";

/**
 * The password reset itself, with no CLI in it: resolve where to send it and what to sign with,
 * mint the token, call the mutation, and turn whatever comes back into an error an operator can
 * act on. `ResetPasswordCommand` supplies the arguments and does the talking.
 *
 * Going through the API rather than the database means this works whatever storage the project
 * registered (SQL, Mongo, anything implementing `CredentialsStorageOperations`), and keeps the CLI
 * free of database drivers. The trade is that the API has to be reachable. That is the right
 * trade: this exists for "locked out of the admin UI", and if the API is down a password is not
 * what is blocking you.
 */

/**
 * Everything this reads from the config comes from an API build param, not off the extension that
 * produced it.
 *
 * That is not a stylistic choice. `hydrateConfig` only keeps an extension whose *definition* is
 * registered with the SDK, and silently drops the rest (GetProjectConfigService.ts:133-142).
 * Neither `Project/SelfHostedAuth` nor `Infra/ApiUrl` registers its definition anywhere, so
 * querying those types always returns an empty array. `Api/BuildParam` is registered
 * (project/src/extensions/index.ts:139), and the values below are exactly what the extensions
 * emit, so reading the build params reads what the API was actually built with. Do not "simplify"
 * this back to `extensionsByType("Project/SelfHostedAuth")`.
 *
 * Referenced as a string so the CLI need not import the React config modules.
 */
const API_BUILD_PARAM_EXTENSION = "Api/BuildParam";

/** Owned by project-standalone's `Infra/ApiUrl`, hence a literal rather than a shared constant. */
const API_URL_BUILD_PARAM = "WEBINY_API_URL";

interface BuildParamParams {
    paramName: string;
    value: unknown;
}

/**
 * The slice of the project config this uses. Typed structurally rather than imported, for the same
 * reason the extension type above is a string.
 */
export interface ProjectConfigLike {
    extensionsByType(type: string): Array<{ params: unknown }>;
}

/**
 * Env var read as the secret when neither `--signing-secret` nor the project config supplies one.
 * The safer of the two overrides: a secret passed as a flag is visible in shell history and in
 * the process list, whereas a secret manager can inject an env var into just this process
 * (`op run -- yarn webiny reset-password ...`).
 */
export const SIGNING_SECRET_ENV_VAR = "WEBINY_SELF_HOSTED_SIGNING_SECRET";

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

/**
 * How long to wait on the API before giving up. Node's fetch has no default timeout, so without
 * this an API that accepts the connection and then never answers hangs the command indefinitely,
 * leaving the operator with no output and no idea whether the password was changed. Generous
 * enough for a cold-started function behind an API Gateway.
 */
const API_TIMEOUT_MS = 30_000;

/** Which instance to reset on, and the secret whose signature that instance will accept. */
export interface ResetPasswordTarget {
    apiUrl: string;
    signingSecret: string;
}

export interface ResetPasswordOverrides {
    apiUrl?: string;
    signingSecret?: string;
}

export interface ResetPasswordInput {
    email: string;
    password: string;
    target: ResetPasswordTarget;
}

export class ResetPassword {
    constructor(private projectConfig: ProjectConfigLike) {}

    /**
     * Separate from `execute` so a misconfiguration surfaces before anyone is asked for a
     * password. Both failures here are dead ends, and typing a new password into one is a
     * miserable way to find that out.
     */
    resolveTarget(overrides: ResetPasswordOverrides): ResetPasswordTarget {
        const signingSecret = this.resolveSigningSecret(overrides.signingSecret);
        const apiUrl = this.resolveApiUrl(overrides.apiUrl);

        return { apiUrl, signingSecret };
    }

    async execute(input: ResetPasswordInput): Promise<void> {
        // Imported here rather than at the top of the file: config validation loads the command
        // module on every CLI invocation to check it exports a command, and only an actual reset
        // needs `jsonwebtoken`.
        const { signCliResetToken } = await import("~/shared/cliResetToken.js");

        const token = signCliResetToken({
            secret: input.target.signingSecret,
            email: input.email
        });

        await this.callApi({
            apiUrl: input.target.apiUrl,
            token,
            password: input.password
        });
    }

    /**
     * Flag, then env var, then project config. Both overrides have to beat the config, or the
     * workflow they exist for does not work: a developer's config almost always resolves a local
     * secret, so ranking it above the env var would sign a production reset with the dev secret
     * and fail with nothing but `INVALID_RESET_TOKEN` to go on. The config is the default, not a
     * preference.
     */
    private resolveSigningSecret(override: string | undefined): string {
        const fromConfig = this.readBuildParam(SIGNING_SECRET_BUILD_PARAM);

        const secret =
            override ||
            process.env[SIGNING_SECRET_ENV_VAR] ||
            (typeof fromConfig === "string" ? fromConfig : undefined);

        if (!secret) {
            throw new Error(
                "No JWT signing secret available. Either configure <SelfHostedAuth " +
                    `signingSecret={...} /> in webiny.config, set $${SIGNING_SECRET_ENV_VAR}, or ` +
                    "pass --signing-secret. It has to match the secret the target API was built with."
            );
        }

        return secret;
    }

    private resolveApiUrl(override: string | undefined): string {
        if (override) {
            return override.replace(/\/+$/, "");
        }

        const fromConfig = this.readBuildParam(API_URL_BUILD_PARAM);
        if (typeof fromConfig !== "string" || !fromConfig) {
            throw new Error(
                "No API URL configured. Add <Infra.ApiUrl url={...} /> to webiny.config, or pass --api-url."
            );
        }

        const url = fromConfig;

        return url.replace(/\/+$/, "");
    }

    /**
     * Reads one `Api/BuildParam` by name. See the note on `API_BUILD_PARAM_EXTENSION` for why the
     * values come from here rather than from the extensions that emit them.
     */
    private readBuildParam(name: string): unknown {
        const buildParams = this.projectConfig.extensionsByType(API_BUILD_PARAM_EXTENSION);

        const match = buildParams.find(
            buildParam => (buildParam.params as BuildParamParams).paramName === name
        );

        return match ? (match.params as BuildParamParams).value : undefined;
    }

    private async callApi(params: { apiUrl: string; token: string; password: string }) {
        const endpoint = `${params.apiUrl}/graphql`;

        // The deadline covers reading the body as well as the request itself: a response whose
        // stream stalls halfway hangs the command just as thoroughly as one that never arrives.
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

        let body: {
            data?: {
                selfHostedAuthCliResetPassword?: {
                    data: boolean | null;
                    error: { code: string; message: string } | null;
                };
            };
            errors?: Array<{ message: string }>;
        };

        try {
            let response: Awaited<ReturnType<typeof fetch>>;
            try {
                response = await fetch(endpoint, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        query: MUTATION,
                        variables: { token: params.token, password: params.password }
                    }),
                    signal: controller.signal
                });
            } catch (err) {
                // An abort lands here too, and reads correctly: from the operator's side a timeout
                // is one more way the API was not reachable.
                throw new Error(
                    `Could not reach the API at ${endpoint}: ${(err as Error).message}. ` +
                        "Make sure it is running, or point at it with --api-url."
                );
            }

            if (!response.ok) {
                throw new Error(`The API at ${endpoint} responded with ${response.status}.`);
            }

            body = (await response.json()) as typeof body;
        } finally {
            clearTimeout(timeout);
        }

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
