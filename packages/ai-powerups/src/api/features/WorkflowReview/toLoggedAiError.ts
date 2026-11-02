/** What is logged of an AI error. */
export interface LoggedAiError {
    name: string;
    message: string;
    statusCode?: number;
}

/** A provider error with the HTTP status of its response. */
interface ErrorWithStatusCode extends Error {
    statusCode?: unknown;
}

/** Text that looks like a credential: provider API keys, bearer tokens and other long tokens. */
const SECRET_PATTERNS: RegExp[] = [
    /\b(?:sk|pk|rk)-[A-Za-z0-9_-]{6,}/g,
    /\bAIza[0-9A-Za-z_-]{20,}/g,
    /\bBearer\s+[^\s"',]+/gi,
    /\b[A-Za-z0-9_-]{40,}\b/g
];

const REDACTED = "[redacted]";

const redactSecrets = (text: string): string => {
    return SECRET_PATTERNS.reduce((redacted, pattern) => redacted.replace(pattern, REDACTED), text);
};

/**
 * What is logged of an AI error: its name, message and status code, never the error object.
 * Provider errors carry the request body and the response headers, which hold the prompt and can
 * hold secrets, and some providers echo the API key in the message, so key-like text in the
 * message is redacted.
 */
export const toLoggedAiError = (error: unknown): LoggedAiError => {
    if (!(error instanceof Error)) {
        return { name: "Error", message: redactSecrets(String(error)) };
    }
    const { statusCode } = error as ErrorWithStatusCode;
    const message = redactSecrets(error.message);
    return typeof statusCode === "number"
        ? { name: error.name, message, statusCode }
        : { name: error.name, message };
};
