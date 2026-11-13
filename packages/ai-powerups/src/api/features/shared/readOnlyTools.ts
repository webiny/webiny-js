import type { ToolSet } from "ai";
import { AiSdkToolDefinition } from "@webiny/api-core/features/ai/index.js";

/**
 * A tool runs unattended only if it says, in its own declaration, that it does not change anything.
 *
 * The default is deliberately the safe one: a tool with no annotations requires approval. Tools are
 * registered by extensions as well as by Webiny, so an author who forgets to annotate gets a confirm
 * prompt rather than silent write access.
 */
export const isReadOnly = (tool: AiSdkToolDefinition.Interface): boolean =>
    tool.annotations?.readOnlyHint === true;

/**
 * The part of a tool set that is safe to hand to a run nobody watches, such as content generation.
 * Such a run has no one to approve a change, so a tool that writes is left out rather than offered.
 */
export const readOnlyToolSet = (
    tools: ToolSet,
    declarations: AiSdkToolDefinition.Interface[]
): ToolSet => {
    const readOnlyNames = new Set(declarations.filter(isReadOnly).map(tool => tool.name));
    const entries = Object.entries(tools).filter(([name]) => readOnlyNames.has(name));

    return Object.fromEntries(entries);
};
