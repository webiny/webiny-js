import type { WorkflowModelPageDto } from "./dto.js";
import type { WorkflowModelRowDto } from "./dto.js";
import type { WorkflowModelPage } from "~/editor/domain/types.js";
import type { WorkflowModelRow } from "~/editor/domain/types.js";

const mapRow = (dto: WorkflowModelRowDto): WorkflowModelRow => {
    const workflow = dto.workflow ?? null;
    if (!workflow) {
        return { model: dto.model, modelId: dto.modelId, name: dto.name, workflow: null };
    }
    return {
        model: dto.model,
        modelId: dto.modelId,
        name: dto.name,
        workflow: { id: workflow.id, name: workflow.name }
    };
};

export const mapWorkflowModelPage = (dto: WorkflowModelPageDto): WorkflowModelPage => {
    return {
        rows: dto.rows.map(mapRow),
        cursor: dto.meta.cursor ?? null,
        hasMoreItems: dto.meta.hasMoreItems
    };
};
