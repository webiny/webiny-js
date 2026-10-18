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
    // The open model shows its loaded workflow's step count; an unsaved new draft is not one.
    if (active && params.draftOpen && !params.draftIsNew) {
        const count = params.draftStepCount;
        return `${count} ${count === 1 ? "step" : "steps"}`;
    }
    return row.workflow === null ? "No workflow" : row.workflow.name;
}

/*
 * The rows of the model panel (R280). Rows carry no step count from the server (QBZ-20), so another
 * bound row shows its workflow's name (a deviation from the design's `{n} steps`).
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
