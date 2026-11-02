import { createAbstraction } from "@webiny/feature/api";
import type { WorkflowModelParser } from "~/features/model/WorkflowModelParser/abstractions.js";

export interface IWorkflowModelParserService {
    /** The first registered parser's answer; `null` when no app knows the model. */
    parse(model: string): WorkflowModelParser.Parsed | null;
}

/** Parses a workflow model with the registered `WorkflowModelParser`s. */
export const WorkflowModelParserService = createAbstraction<IWorkflowModelParserService>(
    "WorkflowModelParserService"
);

export namespace WorkflowModelParserService {
    export type Interface = IWorkflowModelParserService;
}
