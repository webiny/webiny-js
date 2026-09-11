import type { IScheduledAction, IScheduledActionEntry } from "~/shared/abstractions.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { parseIdentifier } from "@webiny/utils";
import { SCHEDULED_ACTION_PUBLISH, SCHEDULED_ACTION_UNPUBLISH } from "~/constants.js";

export class ScheduledActionMapper {
    static toAction<T extends GenericRecord = GenericRecord>(
        action: IScheduledActionEntry<T>
    ): IScheduledAction<T> {
        const { id: scheduleId } = parseIdentifier(action.id);
        const scheduledBy = action.values.scheduledBy;
        return {
            id: scheduleId,
            targetId: action.values.targetId,
            namespace: action.values.namespace,
            /**
             * Mapped field by field on purpose: Headless CMS stores this as an object
             * field, and object values carry a generated `_id` we don't want to leak
             * into the identity.
             */
            scheduledBy: {
                id: scheduledBy.id,
                displayName: scheduledBy.displayName,
                type: scheduledBy.type
            },
            scheduledFor: new Date(action.values.scheduledFor),
            actionType: action.values.actionType,
            title: action.values.title,
            payload: action.values.payload,
            error: action.values.error,
            tenant: action.tenant
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
            publishOn: action.actionType === SCHEDULED_ACTION_PUBLISH ? action.scheduledFor : null,
            unpublishOn:
                action.actionType === SCHEDULED_ACTION_UNPUBLISH ? action.scheduledFor : null,
            actionType: action.actionType,
            title: action.title
        };
    }
}
