import { createAbstraction } from "@webiny/feature/api";
import type { WorkflowAiTool } from "~/features/aiTools/WorkflowAiTool/abstractions.js";

export interface IWorkflowAiToolRegistryService {
    /** The tool with exactly this name; `null` when none is registered. */
    get(name: string): WorkflowAiTool.Interface | null;
    /** Registration order; the last registration per `name` wins and keeps the first one's place. */
    list(): WorkflowAiTool.Interface[];
}

/** The registered AI tools (R167). Turning them into an AI SDK tool set is the runner's job. */
export const WorkflowAiToolRegistryService = createAbstraction<IWorkflowAiToolRegistryService>(
    "WorkflowAiToolRegistryService"
);

export namespace WorkflowAiToolRegistryService {
    export type Interface = IWorkflowAiToolRegistryService;
}
