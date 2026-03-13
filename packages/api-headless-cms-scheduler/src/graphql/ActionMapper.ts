import type { IScheduleActionWithPayload } from "~/features/ScheduleEntryAction/index.js";

export class ActionMapper {
    static fromScheduledAction(action: IScheduleActionWithPayload) {
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
