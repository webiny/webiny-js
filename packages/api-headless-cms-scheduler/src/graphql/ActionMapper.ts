import type { IScheduledAction } from "@webiny/api-scheduler";

export class ActionMapper {
    static fromScheduledAction(action: IScheduledAction<{ modelId: string }>) {
        return {
            id: action.id,
            targetId: action.targetId,
            model: {
                modelId: action.payload?.modelId
            },
            scheduledBy: action.scheduledBy,
            publishOn: action.actionType === "Publish" ? action.scheduledOn : null,
            unpublishOn: action.actionType === "Unpublish" ? action.scheduledOn : null,
            type: action.actionType.toLowerCase(),
            title: action.title
        };
    }
}
