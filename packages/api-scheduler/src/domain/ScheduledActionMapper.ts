import type { IScheduledAction, IScheduledActionEntry } from "~/shared/abstractions.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { parseIdentifier } from "@webiny/utils";

export class ScheduledActionMapper {
    static toAction<T extends GenericRecord = GenericRecord>(
        action: IScheduledActionEntry<T>
    ): IScheduledAction<T> {
        const { id: scheduleId } = parseIdentifier(action.id);
        return {
            id: scheduleId,
            targetId: action.values.targetId,
            namespace: action.values.namespace,
            scheduledBy: action.values.scheduledBy,
            scheduledFor: new Date(action.values.scheduledFor),
            actionType: action.values.actionType,
            title: action.values.title,
            payload: action.values.payload,
            error: action.values.error
        };
    }

    static toActions<T extends GenericRecord = GenericRecord>(
        actions: IScheduledActionEntry<T>[]
    ): IScheduledAction<T>[] {
        return actions.map(ScheduledActionMapper.toAction);
    }

    static toGraphQL<T extends GenericRecord = GenericRecord>(action: IScheduledAction<T>) {
        return {
            id: action.id,
            targetId: action.targetId,
            namespace: action.namespace,
            scheduledBy: action.scheduledBy,
            publishOn: action.actionType === "publish" ? action.scheduledFor : null,
            unpublishOn: action.actionType === "unpublish" ? action.scheduledFor : null,
            actionType: action.actionType,
            title: action.title
        };
    }
}
