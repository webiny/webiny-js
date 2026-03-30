import {
    FunnelConditionActionModel,
    FunnelConditionActionModelDto
} from "../FunnelConditionActionModel";
import { FunnelConditionRuleModel } from "../FunnelConditionRuleModel";

interface HideFieldConditionActionExtraParams {
    targetFieldId: string;
}

export class HideFieldConditionAction extends FunnelConditionActionModel<HideFieldConditionActionExtraParams> {
    static override type = "hideField";
    static override optionLabel = "Hide field";

    constructor(
        conditionRule: FunnelConditionRuleModel,
        dto: FunnelConditionActionModelDto<HideFieldConditionActionExtraParams>
    ) {
        super(conditionRule, {
            type: "hideField",
            params: {
                extra: {
                    targetFieldId: dto.params?.extra?.targetFieldId || ""
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
