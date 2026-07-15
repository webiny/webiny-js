import { parseIdentifier } from "@webiny/utils";
import { SCHEDULED_ACTION_PUBLISH, SCHEDULED_ACTION_UNPUBLISH } from "../constants.js";
class ScheduledActionMapper {
    static toAction(action) {
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
            error: action.values.error,
            tenant: action.tenant
        };
    }
    static toActions(actions) {
        return actions.map(ScheduledActionMapper.toAction);
    }
    static toGraphQL(action) {
        return {
            id: action.id,
            targetId: action.targetId,
            namespace: action.namespace,
            scheduledBy: action.scheduledBy,
            publishOn: action.actionType === SCHEDULED_ACTION_PUBLISH ? action.scheduledFor : null,
            unpublishOn: action.actionType === SCHEDULED_ACTION_UNPUBLISH ? action.scheduledFor : null,
            actionType: action.actionType,
            title: action.title
        };
    }
}
export { ScheduledActionMapper };

//# sourceMappingURL=ScheduledActionMapper.js.map