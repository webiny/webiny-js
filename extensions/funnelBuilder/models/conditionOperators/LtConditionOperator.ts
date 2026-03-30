import {
    FunnelConditionOperatorModel,
    FunnelConditionOperatorModelDto
} from "../FunnelConditionOperatorModel";
import { FunnelFieldValueModel } from "../FunnelFieldValueModel";

type FieldValue = FunnelFieldValueModel<number>;

interface LtConditionOperatorExtraParams {
    threshold?: number;
}

export class LtConditionOperator extends FunnelConditionOperatorModel<
    FieldValue,
    LtConditionOperatorExtraParams
> {
    static override supportedFieldValueTypes = ["number"];
    static override type = "lt";
    static override optionLabel = "lower than";

    constructor(dto: FunnelConditionOperatorModelDto<LtConditionOperatorExtraParams>) {
        super({
            type: "lt",
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

        return value.hasValue() && value.value < this.params.extra.threshold;
    }
}
