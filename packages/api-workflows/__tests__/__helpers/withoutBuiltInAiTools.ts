import {
    READ_TARGET_TOOL_NAME,
    UPDATE_TARGET_FIELDS_TOOL_NAME
} from "~/features/aiTools/constants.js";

/** A row that carries a tool name. */
export interface NamedTool {
    name: string;
}

/** The names of the built-in tools, in registration order. */
export const BUILT_IN_AI_TOOL_NAMES = [READ_TARGET_TOOL_NAME, UPDATE_TARGET_FIELDS_TOOL_NAME];

/**
 * The rows of a list without `readTarget` and `updateTargetFields`. `WorkflowsFeature` registers
 * both in every test container (Task 10), so a test that counts or compares the tools it
 * registered itself filters the built-ins out.
 */
export const withoutBuiltInAiTools = <TTool extends NamedTool>(tools: TTool[]): TTool[] => {
    return tools.filter(tool => !BUILT_IN_AI_TOOL_NAMES.includes(tool.name));
};
