import {
    FunnelConditionOperatorModel,
    FunnelConditionOperatorModelDto
} from "../FunnelConditionOperatorModel";
import { FunnelFieldValueModel } from "../FunnelFieldValueModel";

type FieldValue = FunnelFieldValueModel<number>;

interface GtConditionOperatorExtraParams {
    threshold?: number;
}

export class GtConditionOperator extends FunnelConditionOperatorModel<
    FieldValue,
    GtConditionOperatorExtraParams
> {
    static override supportedFieldValueTypes = ["number"];
    static override type = "gt";
    static override optionLabel = "greater than";
    constructor(dto: FunnelConditionOperatorModelDto<GtConditionOperatorExtraParams>) {
        super({
            type: "gt",
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

        return value.hasValue() && value.value > this.params.extra.threshold;
    }
}
