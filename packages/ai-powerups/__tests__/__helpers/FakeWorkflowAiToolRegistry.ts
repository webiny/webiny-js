import { z } from "zod";
import type { Container } from "@webiny/di";
import { WorkflowAiTool } from "@webiny/api-workflows/features/aiTools/WorkflowAiTool/index.js";
import { WorkflowAiToolRegistryService } from "@webiny/api-workflows/features/aiTools/WorkflowAiToolRegistryService/index.js";

/** A tool that does nothing: only its name matters to the step type. */
export const createFakeAiTool = (name: string): WorkflowAiTool.Interface => {
    return {
        name,
        title: `${name} title`,
        description: `${name} description`,
        inputSchema: z.object({}),
        execute: async () => {
            return { ok: true };
        }
    };
};

/**
 * Registers a `WorkflowAiToolRegistryService` that knows exactly `names`; any other name is
 * `null`, like the real registry for a name that is not registered (or was dropped as invalid).
 * Returns the names `get` was asked for, in order.
 */
export const registerFakeWorkflowAiToolRegistry = (container: Container, names: string[]) => {
    const tools = names.map(createFakeAiTool);
    const asked: string[] = [];
    container.registerInstance(WorkflowAiToolRegistryService, {
        get: (name: string) => {
            asked.push(name);
            return tools.find(tool => tool.name === name) ?? null;
        },
        list: () => tools
    });
    return { asked };
};
