import {
    GetSecretValueCommand,
    SecretsManagerClient
} from "@webiny/aws-sdk/client-secrets-manager/index.js";

type Env = Record<string, string | undefined>;

/** Reads of the secret that are denied are tried this many times in all. */
const SECRET_READ_ATTEMPTS = 5;
/** The wait before the n-th retry, in milliseconds: 1 s, 2 s, 3 s, 4 s. */
const retryDelayMs = (attempt: number) => 1_000 * attempt;

/**
 * How long a password read from the secret is used before the next connection reads it again. RDS
 * rotates a managed secret's password (every 7 days by default); an execution environment can
 * outlive that. A login refused with the old password reads it again at once (`forgetPgPassword`).
 */
export const PG_SECRET_TTL_MS = 5 * 60_000;

interface ICachedPassword {
    password: Promise<string>;
    readAt: number;
}

/*
 * One read per secret, per execution environment, every PG_SECRET_TTL_MS at most. A failed read is
 * forgotten, so the next try reads again.
 */
const passwords = new Map<string, ICachedPassword>();

const isExpired = (cached: ICachedPassword): boolean => {
    return Date.now() - cached.readAt >= PG_SECRET_TTL_MS;
};

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
 * Proxy uses). The secret is read on the environment's first connection, and again by the first
 * connection after `PG_SECRET_TTL_MS`, or after `forgetPgPassword`; the connections in between
 * reuse it.
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

    const cached = passwords.get(secretArn);
    if (cached && !isExpired(cached)) {
        return cached.password;
    }
    const entry: ICachedPassword = {
        readAt: Date.now(),
        password: readSecretPassword(secretArn).catch(error => {
            if (passwords.get(secretArn) === entry) {
                passwords.delete(secretArn);
            }
            throw error;
        })
    };
    passwords.set(secretArn, entry);
    return entry.password;
};

/**
 * Whether the next connection must read the secret's password again: it was read
 * `PG_SECRET_TTL_MS` ago or more, or was forgotten. Never for `WEBINY_PG_PASSWORD`.
 */
export const isPgPasswordStale = (env: Env = process.env): boolean => {
    const secretArn = env.WEBINY_PG_SECRET_ARN;
    if (env.WEBINY_PG_PASSWORD || !secretArn) {
        return false;
    }
    const cached = passwords.get(secretArn);
    return !cached || isExpired(cached);
};

/**
 * Forgets the secret's password, so the next connection reads it again. For a login the database
 * refused: the secret was rotated since it was read.
 */
export const forgetPgPassword = (env: Env = process.env): void => {
    const secretArn = env.WEBINY_PG_SECRET_ARN;
    if (secretArn) {
        passwords.delete(secretArn);
    }
};
