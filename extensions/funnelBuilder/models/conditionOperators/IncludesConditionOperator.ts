import {
    FunnelConditionOperatorModel,
    FunnelConditionOperatorModelDto
} from "../FunnelConditionOperatorModel";
import { FunnelFieldValueModel } from "../FunnelFieldValueModel";

type FieldValue = FunnelFieldValueModel<string | number | boolean>;

interface IncludesConditionOperatorExtraParams {
    value?: string | number | boolean;
}

export class IncludesConditionOperator extends FunnelConditionOperatorModel<
    FieldValue,
    IncludesConditionOperatorExtraParams
> {
    static override supportedFieldValueTypes = [
        "string",
        "stringArray",
        "number",
        "numberArray",
        "booleanArray"
    ];
    static override type = "includes";
    static override optionLabel = "includes";

    constructor(dto: FunnelConditionOperatorModelDto<IncludesConditionOperatorExtraParams>) {
        super({
            type: "includes",
            params: {
                extra: {
                    value: dto.params?.extra?.value
                }
            }
        });
    }

    override evaluate(value: FieldValue): boolean {
        if (!value.hasValue()) {
            return false;
        }

        if (!this.params.extra.value) {
            return false;
        }

        if (value.array) {
            return Array.isArray(value.value) && value.value.includes(this.params.extra.value);
        }

        return String(value.value).includes(String(this.params.extra.value));
    }
}
