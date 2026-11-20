import type { AiSdkToolDefinition } from "./abstractions.js";

/**
 * A tool runs unattended only if it says, in its own declaration, that it does not change anything.
 *
 * The default is deliberately the safe one: a tool with no annotations counts as one that writes.
 * Tools are registered by extensions as well as by Webiny, so an author who forgets to annotate gets
 * a confirm prompt in the assistant, and no place in unattended runs, rather than silent write access.
 */
export const isReadOnlyTool = (tool: AiSdkToolDefinition.Interface): boolean =>
    tool.annotations?.readOnlyHint === true;
