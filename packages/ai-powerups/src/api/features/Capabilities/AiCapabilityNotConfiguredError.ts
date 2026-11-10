/**
 * A capability that cannot run because the project's AI settings are incomplete: no model on the
 * role it uses, a connection that was deleted, a connection with no key, or a model paired with a
 * connection for another vendor.
 *
 * Typed so a caller can tell "set this up first" from a run that failed. The admin assistant shows
 * a setup screen for it instead of an error. The message names the setting to fix, so a caller that
 * only shows messages loses nothing.
 */
export class AiCapabilityNotConfiguredError extends Error {
    readonly code = "AI_CAPABILITY_NOT_CONFIGURED" as const;
}
