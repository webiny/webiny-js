import {
    FunnelConditionOperatorModel,
    FunnelConditionOperatorModelDto
} from "../FunnelConditionOperatorModel";
import { FunnelFieldValueModel } from "../FunnelFieldValueModel";

type FieldValue = FunnelFieldValueModel<string | number>;

interface EqConditionOperatorExtraParams {
    value?: string | number | boolean;
}

export class EqConditionOperator extends FunnelConditionOperatorModel<
    FieldValue,
    EqConditionOperatorExtraParams
> {
    static override supportedFieldValueTypes = ["string", "number", "boolean"];
    static override type = "eq";
    static override optionLabel = "equals";

    constructor(dto: FunnelConditionOperatorModelDto<EqConditionOperatorExtraParams>) {
        super({
            type: "eq",
            params: {
                extra: {
                    value: dto.params?.extra?.value
                }
            }
        });
    }

    override evaluate(value: FieldValue): boolean {
        return value.value === this.params.extra.value;
    }
}
