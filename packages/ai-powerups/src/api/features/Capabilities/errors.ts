/**
 * The capability cannot run as this project has it configured: switched off, no model on the role
 * it needs, a connection that was deleted or has no key, a model from another vendor than the key.
 *
 * Kept apart from a plain `Error`, which the resolver still uses for things that are not a
 * setting, such as a caller passing an id nothing registered. Background work treats this one as
 * "skip, and say why" rather than as a failure, because nothing went wrong that a retry could fix.
 * Someone has to change a setting.
 */
export class AiCapabilityUnavailableError extends Error {
    readonly code = "AI_CAPABILITY_UNAVAILABLE" as const;
}
