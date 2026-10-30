import { SIGNING_SECRET_ENV_VAR } from "~/shared/envVars.js";

/**
 * The password reset itself, with no CLI in it: mint the token, call the mutation, and turn whatever
 * comes back into an error an operator can act on. It reads no config and no env: the caller passes
 * the target (`readResetPasswordTarget` for the CLI), so seeding scripts and installers can call it
 * with values they already have.
 *
 * Going through the API rather than the database means this works whatever storage the project
 * registered (SQL, Mongo, anything implementing `CredentialsStorageOperations`), and keeps the CLI
 * free of database drivers. The trade is that the API has to be reachable. That is the right
 * trade: this exists for "locked out of the admin UI", and if the API is down a password is not
 * what is blocking you.
 */

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

export interface ResetPasswordInput {
    email: string;
    password: string;
    target: ResetPasswordTarget;
}

async function callApi(params: { apiUrl: string; token: string; password: string }) {
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
        throw new Error(explainError(result.error, endpoint));
    }
}

function explainError(error: { code: string; message: string }, endpoint: string): string {
    const base = `${error.message} (${error.code})`;

    // The token is signed with whatever secret resolved on THIS machine, and verified against
    // whatever the API runs with. Those differ more often than anything else that
    // produces this code, and the bare message gives no hint of it.
    if (error.code === "INVALID_RESET_TOKEN") {
        return (
            `${base} The usual cause is a signing secret mismatch: the secret this command ` +
            `signed with is not the one ${endpoint} runs with. Pass the right one with ` +
            `--signing-secret or $${SIGNING_SECRET_ENV_VAR}. A clock skew of over two minutes ` +
            "between this machine and the API will do it too."
        );
    }

    return base;
}

export class ResetPassword {
    async execute(input: ResetPasswordInput): Promise<void> {
        // Imported here rather than at the top of the file: config validation loads the command
        // module on every CLI invocation to check it exports a command, and only an actual reset
        // needs `jsonwebtoken`.
        const { signCliResetToken } = await import("~/shared/cliResetToken.js");

        const token = signCliResetToken({
            secret: input.target.signingSecret,
            email: input.email
        });

        await callApi({
            apiUrl: input.target.apiUrl,
            token,
            password: input.password
        });
    }
}
