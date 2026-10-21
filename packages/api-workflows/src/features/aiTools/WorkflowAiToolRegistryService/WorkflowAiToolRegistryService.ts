import { Logger } from "@webiny/api-core/features/logger/index.js";
import { isWorkflowAiToolName } from "~/domain/aiTools/isWorkflowAiToolName.js";
import { WorkflowAiTool } from "~/features/aiTools/WorkflowAiTool/abstractions.js";
import { WorkflowAiToolRegistryService as Abstraction } from "./abstractions.js";

class WorkflowAiToolRegistryServiceImpl implements Abstraction.Interface {
    private readonly tools = new Map<string, WorkflowAiTool.Interface>();

    public constructor(tools: WorkflowAiTool.Interface[], logger: Logger.Interface) {
        for (const tool of tools) {
            if (!isWorkflowAiToolName(tool.name)) {
                logger.error(
                    {
                        toolName: tool.name,
                        reason: `The AI tool name "${tool.name}" is not valid. Use 1 to 64 letters, digits or underscores, starting with a letter.`
                    },
                    "The AI tool was dropped."
                );
                continue;
            }
            this.tools.set(tool.name, tool);
        }
    }

    public get(name: string): WorkflowAiTool.Interface | null {
        return this.tools.get(name) ?? null;
    }

    public list(): WorkflowAiTool.Interface[] {
        return [...this.tools.values()];
    }
}

export const WorkflowAiToolRegistryService = Abstraction.createImplementation({
    implementation: WorkflowAiToolRegistryServiceImpl,
    dependencies: [[WorkflowAiTool, { multiple: true }], Logger]
});
