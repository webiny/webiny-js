import type { EditorStepDto } from "./dto.js";
import type { EditorWorkflowDto } from "./dto.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";

const mapStep = (dto: EditorStepDto): EditorStep => {
    return {
        id: dto.id,
        title: dto.title,
        color: dto.color,
        description: dto.description ?? null,
        type: dto.type,
        notificationIds: dto.notifications.map(notification => notification.id),
        config: dto.config
    };
};

/*
 * Maps a `WorkflowsWorkflow`. `savedOn` and `createdOn` stay the exact strings the server sent:
 * the store call sends `savedOn` back and the server compares strings (D131).
 */
export const mapEditorWorkflow = (dto: EditorWorkflowDto): EditorWorkflow => {
    return {
        id: dto.id,
        name: dto.name,
        models: dto.models,
        steps: dto.steps.map(mapStep),
        createdOn: dto.createdOn,
        savedOn: dto.savedOn,
        createdBy: { id: dto.createdBy.id, displayName: dto.createdBy.displayName },
        savedBy: { id: dto.savedBy.id, displayName: dto.savedBy.displayName }
    };
};
