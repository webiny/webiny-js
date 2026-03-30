import {
    FunnelConditionActionModel,
    FunnelConditionActionModelDto
} from "../FunnelConditionActionModel";
import { FunnelConditionRuleModel } from "../FunnelConditionRuleModel";

interface DisableFieldConditionActionExtraParams {
    targetFieldId: string;
}

export class DisableFieldConditionAction extends FunnelConditionActionModel<DisableFieldConditionActionExtraParams> {
    static override type = "disableField";
    static override optionLabel = "Disable field";

    constructor(
        conditionRule: FunnelConditionRuleModel,
        dto?: FunnelConditionActionModelDto<DisableFieldConditionActionExtraParams>
    ) {
        super(conditionRule, {
            type: "disableField",
            params: {
                extra: {
                    targetFieldId: dto?.params?.extra?.targetFieldId || ""
                }
            }
        });
    }

    override isApplicable() {
        const field = this.conditionRule.funnel.fields.find(f => {
            return f.id === this.params.extra.targetFieldId;
        });

        if (!field) {
            return;
        }

        return this.conditionRule.funnel.steps.find(s => {
            return s.id === field.stepId;
        });
    }
}
