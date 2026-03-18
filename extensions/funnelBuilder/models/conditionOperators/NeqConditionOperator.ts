import {
    FunnelConditionOperatorModel,
    FunnelConditionOperatorModelDto
} from "../FunnelConditionOperatorModel";
import { FunnelFieldValueModel } from "../FunnelFieldValueModel";

type FieldValue = FunnelFieldValueModel<string | number>;

interface NeqConditionOperatorExtraParams {
    value?: string | number | boolean;
}

export class NeqConditionOperator extends FunnelConditionOperatorModel<
    FieldValue,
    NeqConditionOperatorExtraParams
> {
    static override supportedFieldValueTypes = ["string", "number", "boolean"];
    static override type = "neq";
    static override optionLabel = "not equal";

    constructor(dto: FunnelConditionOperatorModelDto<NeqConditionOperatorExtraParams>) {
        super({
            type: "neq",
            params: {
                extra: {
                    value: dto.params?.extra?.value
                }
            }
        });
    }

    override evaluate(value: FieldValue): boolean {
        return value.value !== this.params.extra.value;
    }
}
