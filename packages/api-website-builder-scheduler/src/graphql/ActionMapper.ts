import type { ISchedulePageActionWithPayload } from "~/features/SchedulePageAction/index.js";

export class ActionMapper {
    static fromScheduledAction(action: ISchedulePageActionWithPayload) {
        return {
            id: action.id,
            targetId: action.targetId,
            scheduledBy: action.scheduledBy,
            publishOn: action.actionType === "Publish" ? action.scheduledFor : null,
            unpublishOn: action.actionType === "Unpublish" ? action.scheduledFor : null,
            type: action.actionType.toLowerCase(),
            title: action.title
        };
    }
}
