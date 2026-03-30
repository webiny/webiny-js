import { type FunnelConditionActionModelDto } from "../FunnelConditionActionModel";
import { FunnelConditionRuleModel } from "../FunnelConditionRuleModel";
import { registry } from "./registry";

export const listConditionActions = () => registry;

export const conditionActionFromDto = (
    conditionRule: FunnelConditionRuleModel,
    dto: FunnelConditionActionModelDto<any>
) => {
    const ActionClass = registry.find(actionClass => actionClass.type === dto.type);
    if (!ActionClass) {
        throw new Error(`Unknown condition action: ${dto.type}`);
    }
    return new ActionClass(conditionRule, dto);
};
