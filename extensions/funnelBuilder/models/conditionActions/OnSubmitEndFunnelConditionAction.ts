import {
    FunnelConditionActionModel,
    FunnelConditionActionModelDto
} from "../FunnelConditionActionModel";
import { FunnelConditionRuleModel } from "../FunnelConditionRuleModel";

interface OnSubmitEndFunnelConditionActionExtraParams {
    evaluationStep: string;
}

export class OnSubmitEndFunnelConditionAction extends FunnelConditionActionModel<OnSubmitEndFunnelConditionActionExtraParams> {
    static override type = "onSubmitEndFunnel";
    static override optionLabel = "End funnel";

    constructor(
        conditionRule: FunnelConditionRuleModel,
        dto: FunnelConditionActionModelDto<OnSubmitEndFunnelConditionActionExtraParams>
    ) {
        super(conditionRule, {
            type: "onSubmitEndFunnel",
            params: {
                extra: {
                    evaluationStep: dto.params?.extra?.evaluationStep || ""
                }
            }
        });
    }

    override isApplicable() {
        const evaluationStep = this.params.extra.evaluationStep;
        return this.conditionRule.funnel.steps.find(s => s.id === evaluationStep);
    }
}
