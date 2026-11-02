/**
 * Env var carrying the HS256 secret that signs and verifies login tokens and CLI reset tokens.
 * `<SelfHostedAuth signingSecret>` sets it for `webiny watch` and `webiny serve`; a deployed API
 * gets it from its environment. The standalone API handler reads it at startup and refuses to start
 * without it. Named here because the config, the API handler and the CLI must agree on it.
 */
export const SIGNING_SECRET_ENV_VAR = "WEBINY_SELF_HOSTED_AUTH_SECRET";
