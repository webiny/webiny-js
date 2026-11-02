import { createAbstraction } from "@webiny/feature/api";

/** What an app reads from a workflow model, e.g. `{ app: "cms", modelId: "article" }`. */
export interface ParsedWorkflowModel {
    /** The app the model belongs to; least loaded counts load per app (D137). */
    app: string;
    /** The id of the model, what a rule's `modelId` condition compares (R113). */
    modelId: string;
}

export interface IWorkflowModelParser {
    /** The parsed model; `null` when the model is not this app's. */
    parse(model: string): ParsedWorkflowModel | null;
}

/**
 * Reads a workflow model (`WorkflowValues.models`, `ReviewData.model`) for one app.
 * Multi-registered: every app adapter registers its own, so the engine knows no app or model.
 * The engine asks them through `WorkflowModelParserService`.
 */
export const WorkflowModelParser = createAbstraction<IWorkflowModelParser>("WorkflowModelParser");

export namespace WorkflowModelParser {
    export type Interface = IWorkflowModelParser;
    export type Parsed = ParsedWorkflowModel;
}
