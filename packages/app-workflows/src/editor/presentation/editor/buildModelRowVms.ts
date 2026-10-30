import type { WorkflowModelRow } from "~/editor/domain/types.js";
import type { ModelRowVm } from "./abstractions.js";

export interface ModelRowsParams {
    rows: WorkflowModelRow[];
    activeModelId: string | null;
    draftOpen: boolean;
    draftIsNew: boolean;
    draftDirty: boolean;
    draftStepCount: number;
}

function getSubLine(row: WorkflowModelRow, active: boolean, params: ModelRowsParams): string {
    // The open model shows its draft's live step count; an unsaved new draft is not one.
    if (active && params.draftOpen && !params.draftIsNew) {
        const count = params.draftStepCount;
        return `${count} ${count === 1 ? "step" : "steps"}`;
    }
    if (row.workflow === null) {
        return "No workflow";
    }
    const count = row.workflow.stepCount;
    return `${count} ${count === 1 ? "step" : "steps"}`;
}

/*
 * The rows of the model panel (R280): `{n} steps` for a model with a workflow, `No workflow` for one
 * without. The open model counts its draft's steps as they change; the others use the server's count.
 */
export const buildModelRowVms = (params: ModelRowsParams): ModelRowVm[] => {
    return params.rows.map(row => {
        const active = row.modelId === params.activeModelId;
        return {
            modelId: row.modelId,
            name: row.name,
            subLine: getSubLine(row, active, params),
            bound: row.workflow !== null,
            unsaved: active && params.draftDirty,
            active
        };
    });
};
