import {
    GetSecretValueCommand,
    SecretsManagerClient
} from "@webiny/aws-sdk/client-secrets-manager/index.js";

type Env = Record<string, string | undefined>;

/** Reads of the secret that are denied are tried this many times in all. */
const SECRET_READ_ATTEMPTS = 5;
/** The wait before the n-th retry, in milliseconds: 1 s, 2 s, 3 s, 4 s. */
const retryDelayMs = (attempt: number) => 1_000 * attempt;

/* One read per secret, per execution environment. A failed read is forgotten, so the next try reads again. */
const passwords = new Map<string, Promise<string>>();

const readSecretPassword = async (secretArn: string): Promise<string> => {
    const client = new SecretsManagerClient({});
    for (let attempt = 1; ; attempt++) {
        try {
            const result = await client.send(new GetSecretValueCommand({ SecretId: secretArn }));
            return parsePassword(secretArn, result.SecretString);
        } catch (error) {
            // Right after a deploy, the function role's new permission to read the secret may not
            // have reached every endpoint yet (IAM is eventually consistent).
            const denied = (error as { name?: string }).name === "AccessDeniedException";
            if (!denied || attempt >= SECRET_READ_ATTEMPTS) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, retryDelayMs(attempt)));
        }
    }
};

const parsePassword = (secretArn: string, secretString: string | undefined): string => {
    let value: { password?: unknown } | undefined;
    try {
        value = JSON.parse(secretString || "{}");
    } catch {
        throw new Error(
            `The Postgres secret ${secretArn} is not JSON. It must hold { "username", "password" }.`
        );
    }
    if (typeof value?.password !== "string" || !value.password) {
        throw new Error(`The Postgres secret ${secretArn} has no password.`);
    }
    return value.password;
};

/**
 * The Postgres password: `WEBINY_PG_PASSWORD` when it's set (local runs), otherwise the `password`
 * of the Secrets Manager secret `WEBINY_PG_SECRET_ARN` (`{ username, password }`, the secret RDS
 * Proxy uses). The secret is read once per execution environment, on its first connection, however
 * many connections it opens later.
 */
export const readPgPassword = (env: Env = process.env): Promise<string> => {
    if (env.WEBINY_PG_PASSWORD) {
        return Promise.resolve(env.WEBINY_PG_PASSWORD);
    }
    const secretArn = env.WEBINY_PG_SECRET_ARN;
    if (!secretArn) {
        return Promise.reject(
            new Error(
                "The Postgres password is not set: set WEBINY_PG_SECRET_ARN (a Secrets Manager secret) or WEBINY_PG_PASSWORD."
            )
        );
    }

    let password = passwords.get(secretArn);
    if (!password) {
        password = readSecretPassword(secretArn).catch(error => {
            passwords.delete(secretArn);
            throw error;
        });
        passwords.set(secretArn, password);
    }
    return password;
};
