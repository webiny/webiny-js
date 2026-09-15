import type { IResolvedAiCapability } from "./abstractions.js";

/**
 * Appends a project's additional instructions to a system prompt.
 *
 * Appending is the default way a project adjusts a prompt, and the reason is upgrades: a project
 * that appends keeps getting our prompt improvements, while a project that replaces the prompt is
 * frozen at whatever we shipped the day they edited it. The heading is there so the model reads the
 * project's text as instructions rather than as more of ours.
 */
export const withAdditionalInstructions = (
    systemText: string,
    resolved: Pick<IResolvedAiCapability, "additionalInstructions">
): string => {
    if (!resolved.additionalInstructions) {
        return systemText;
    }

    return `${systemText}

### Project instructions

These come from this project's settings and take precedence over the general guidance above.

${resolved.additionalInstructions}`;
};
