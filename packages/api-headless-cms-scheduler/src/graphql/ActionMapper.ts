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
            publishOn: action.actionType === "Publish" ? action.scheduledFor : null,
            unpublishOn: action.actionType === "Unpublish" ? action.scheduledFor : null,
            type: action.actionType.toLowerCase(),
            title: action.title
        };
    }
}
