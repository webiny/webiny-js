import {
    FunnelConditionActionModel,
    FunnelConditionActionModelDto
} from "../FunnelConditionActionModel";
import { FunnelConditionRuleModel } from "../FunnelConditionRuleModel";

interface OnSubmitActivateStepConditionActionExtraParams {
    targetStepId: string;
    evaluationStep: string;
}

export class OnSubmitActivateStepConditionAction extends FunnelConditionActionModel<OnSubmitActivateStepConditionActionExtraParams> {
    static override type = "onSubmitActivateStep";
    static override optionLabel = "Go to step";

    constructor(
        conditionRule: FunnelConditionRuleModel,
        dto: FunnelConditionActionModelDto<OnSubmitActivateStepConditionActionExtraParams>
    ) {
        super(conditionRule, {
            type: "onSubmitActivateStep",
            params: {
                extra: {
                    evaluationStep: dto.params?.extra?.evaluationStep || "",
                    targetStepId: dto.params?.extra?.targetStepId || ""
                }
            }
        });
    }

    override isApplicable() {
        const evaluationStep = this.params.extra.evaluationStep;
        return this.conditionRule.funnel.steps.find(s => s.id === evaluationStep);
    }
}
