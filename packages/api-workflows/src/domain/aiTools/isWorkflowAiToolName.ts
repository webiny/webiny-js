const AI_TOOL_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;

/**
 * Whether `name` is a valid `WorkflowAiTool` name (R167): a letter, then up to 63 letters, digits
 * or underscores. Model providers accept tool names of this shape only, and one bad name makes
 * the provider refuse the whole call. Pure: no dependency.
 */
export const isWorkflowAiToolName = (name: string): boolean => {
    return AI_TOOL_NAME_PATTERN.test(name);
};
