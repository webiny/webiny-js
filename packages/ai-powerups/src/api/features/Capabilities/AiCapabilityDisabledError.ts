/**
 * A capability someone switched off in settings.
 *
 * Typed, rather than a plain `Error` like the resolver's other failures, because it is the one
 * failure that is not a problem. Every other reason a capability cannot resolve (no model on the
 * role, a deleted connection, a missing key) is a misconfiguration someone should hear about. This
 * one is a decision someone already made, and a caller that runs automatically, on an upload or a
 * page save, should skip quietly instead of reporting it as a failure every time.
 *
 * A caller a user triggered by hand can still show the message: it names the switch to flip.
 */
export class AiCapabilityDisabledError extends Error {
    readonly code = "AI_CAPABILITY_DISABLED" as const;

    constructor(
        readonly capabilityId: string,
        label: string,
        settingsPath: string
    ) {
        super(`"${label}" is switched off. Turn it back on under ${settingsPath} → Capabilities.`);
    }
}
