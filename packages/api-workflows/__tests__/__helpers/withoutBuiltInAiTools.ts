import { BUILT_IN_AI_TOOL_NAMES } from "~/features/aiTools/constants.js";

/**
 * The rows of a list without `readTarget` and `updateTargetFields`. `WorkflowsFeature` registers
 * both in every test container (Task 10), so a test that counts or compares the tools it
 * registered itself filters the built-ins out.
 */
export const withoutBuiltInAiTools = <TTool extends { name: string }>(tools: TTool[]): TTool[] => {
    return tools.filter(tool => !BUILT_IN_AI_TOOL_NAMES.includes(tool.name));
};
