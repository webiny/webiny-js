/**
 * A model chosen on a workflow step that no settings connection can run (R169): its provider has
 * no connection with a stored key any more, the provider no longer lists the model, or the id is
 * not `<provider>/<id>`.
 *
 * Typed, like `AiCapabilityDisabledError`, so a caller maps it to its own fixed text without
 * parsing the message. The message names the fix and carries no settings content.
 */
export class AiModelNotAvailableError extends Error {
    readonly code = "AI_MODEL_NOT_AVAILABLE" as const;

    constructor(readonly model: string) {
        super(
            `The model "${model}" is not available. Add a connection for its provider under Settings → AI Power-Ups.`
        );
    }
}
