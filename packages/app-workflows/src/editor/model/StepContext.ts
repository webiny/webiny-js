import type { AiModel } from "~/editor/domain/types.js";
import type { AiTool } from "~/editor/domain/types.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { WorkflowTeamSummary } from "~/editor/domain/types.js";

/*
 * What a step's summary and warnings need besides the step (plain data, no VM). The presenter
 * builds one per step from what it has loaded.
 */
export interface StepContext {
    // Every team the editor knows by id (resolved at load, or seen in a search).
    teams: WorkflowTeamSummary[];
    automations: AutomationDefinition[];
    // False when the definition list did not load, so no automation is called gone.
    automationsLoaded: boolean;
    // `null` while the model list is not loaded (failed, or no AI editor).
    aiModels: AiModel[] | null;
    // `null` while the tool list is not loaded (failed, or no AI editor); drives ` · can change content` (R283).
    aiTools: AiTool[] | null;
    aiEditable: boolean;
    // The step as stored on the server; null for a step added in this session (QBZ-13).
    baselineStep: EditorStep | null;
}
