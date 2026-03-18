import {
    FunnelConditionOperatorModel,
    FunnelConditionOperatorModelDto
} from "../FunnelConditionOperatorModel";
import { FunnelFieldValueModel } from "../FunnelFieldValueModel";

type FieldValue = FunnelFieldValueModel<number>;

interface GteConditionOperatorExtraParams {
    threshold?: number;
}

export class GteConditionOperator extends FunnelConditionOperatorModel<
    FieldValue,
    GteConditionOperatorExtraParams
> {
    static override supportedFieldValueTypes = ["number"];
    static override type = "gte";
    static override optionLabel = "greater than or equal";

    constructor(dto: FunnelConditionOperatorModelDto<GteConditionOperatorExtraParams>) {
        super({
            type: "gte",
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

        return value.hasValue() && value.value >= this.params.extra.threshold;
    }
}
