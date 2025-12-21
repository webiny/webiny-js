import type { IScheduledAction } from "@webiny/api-scheduler";

export class ActionMapper {
    static fromScheduledAction(modelId: string, action: IScheduledAction) {
        return {
            id: action.id,
            targetId: action.targetId,
            model: {
                modelId
            },
            scheduledBy: action.scheduledBy,
            publishOn: action.actionType === "Publish" ? action.scheduledOn : null,
            unpublishOn: action.actionType === "Unpublish" ? action.scheduledOn : null,
            type: action.actionType.toLowerCase(),
            title: action.title
        };
    }
}
