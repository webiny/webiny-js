import {
    FunnelConditionOperatorModel,
    FunnelConditionOperatorModelDto
} from "../FunnelConditionOperatorModel";
import { FunnelFieldValueModel } from "../FunnelFieldValueModel";

type FieldValue = FunnelFieldValueModel<number>;

interface LteConditionOperatorExtraParams {
    threshold?: number;
}

export class LteConditionOperator extends FunnelConditionOperatorModel<
    FieldValue,
    LteConditionOperatorExtraParams
> {
    static override supportedFieldValueTypes = ["number"];
    static override type = "lte";
    static override optionLabel = "lower than or equal";

    constructor(dto: FunnelConditionOperatorModelDto<LteConditionOperatorExtraParams>) {
        super({
            type: "lte",
            params: {
                extra: {
                    threshold: dto.params?.extra?.threshold
                }
            }
        });
    }

    override evaluate(value: FieldValue): boolean {
        if (!this.params.extra.threshold) {
            return false;
        }

        return value.hasValue() && value.value <= this.params.extra.threshold;
    }
}
