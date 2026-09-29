import type { IResolvedAiCapability } from "./abstractions.js";

/**
 * Appends a project's additional instructions to a capability's system prompt.
 *
 * Appending is the only way a project adjusts a prompt, and the reason is upgrades: a project that
 * appends keeps getting our prompt improvements, while one that replaced the prompt would be frozen
 * at whatever we shipped the day they edited it. The heading is there so the model reads the
 * project's text as instructions rather than as more of ours.
 *
 * `baseText` defaults to the capability's own guidance, which is what most callers want. The two
 * generation use cases pass their own, because they build a prompt per request from a content model
 * schema or a component catalog and the capability declares no fixed guidance of its own.
 */
export const withAdditionalInstructions = (
    resolved: Pick<IResolvedAiCapability, "guidance" | "additionalInstructions">,
    baseText: string = resolved.guidance
): string => {
    if (!resolved.additionalInstructions) {
        return baseText;
    }

    return `${baseText}

### Project instructions

These come from this project's settings and take precedence over the general guidance above.

${resolved.additionalInstructions}`;
};
