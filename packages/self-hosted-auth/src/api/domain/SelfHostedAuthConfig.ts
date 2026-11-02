import { createAbstraction } from "@webiny/feature/api";

export interface ISelfHostedAuthConfig {
    /** HS256 secret that signs and verifies login tokens and CLI reset tokens. Never empty. */
    readonly signingSecret: string;
}

/**
 * Deployment settings of self-hosted auth. The API handler that registers
 * `SelfHostedAuthApiFeature` supplies them, e.g. read from env when the server starts.
 */
export const SelfHostedAuthConfig =
    createAbstraction<ISelfHostedAuthConfig>("SelfHostedAuthConfig");

export namespace SelfHostedAuthConfig {
    export type Interface = ISelfHostedAuthConfig;
}
